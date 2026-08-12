<?php

namespace App\Services;

use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\EgressServiceClient;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\RoomServiceClient;
use Agence104\LiveKit\VideoGrant;

class LiveKitService
{
    private string $apiKey;
    private string $apiSecret;
    private string $host;
    private ?EgressServiceClient $egressClient = null;

    public function __construct()
    {
        $this->apiKey    = config('services.livekit.key') ?? '';
        $this->apiSecret = config('services.livekit.secret') ?? '';
        $rawHost         = config('services.livekit.host') ?? 'https://cloud.livekit.io';
        
        // RoomServiceClient requires HTTP/HTTPS scheme for REST API requests
        $this->host      = str_replace(['wss://', 'ws://'], ['https://', 'http://'], $rawHost);

        if (!empty($this->apiKey) && !empty($this->apiSecret)) {
            try {
                $this->egressClient = new EgressServiceClient($this->host, $this->apiKey, $this->apiSecret);
            } catch (\Throwable $e) {
                logger()->warning('LiveKit EgressServiceClient initialization notice: ' . get_class($e) . ' - ' . $e->getMessage());
            }
        }
    }

    /**
     * Generate a LiveKit JWT access token for a participant.
     *
     * @param  string  $roomName       The room the token grants access to
     * @param  string  $participantIdentity  Unique identity (e.g. "hr_3" or "applicant_7")
     * @param  string  $participantName      Display name shown in the room
     * @param  bool    $canPublish     Whether this participant can publish audio/video
     * @param  int     $ttl            Token TTL in seconds (default 4 hours)
     * @return string  Signed JWT
     */
    public function generateToken(
        string $roomName,
        string $participantIdentity,
        string $participantName,
        bool   $canPublish = true,
        int    $ttl = 14400
    ): string {
        $tokenOptions = (new AccessTokenOptions())
            ->setIdentity($participantIdentity)
            ->setName($participantName)
            ->setTtl($ttl);

        $videoGrant = (new VideoGrant())
            ->setRoomJoin()
            ->setRoomName($roomName)
            ->setCanPublish($canPublish)
            ->setCanSubscribe(true)
            ->setCanPublishData(true);

        return (new AccessToken($this->apiKey, $this->apiSecret))
            ->init($tokenOptions)
            ->setGrant($videoGrant)
            ->toJwt();
    }

    /**
     * Create (or retrieve) a LiveKit room via the server API.
     * Idempotent — LiveKit returns the existing room if the name already exists.
     *
     * @param  string  $roomName
     * @param  int     $emptyTimeout  Seconds before an empty room is destroyed (default 10 min)
     * @param  int     $maxParticipants
     * @return object|null  LiveKit Room object or null on soft notice
     */
    public function ensureRoom(
        string $roomName,
        int    $emptyTimeout = 600,
        int    $maxParticipants = 10
    ): ?object {
        if (empty($this->apiKey) || empty($this->apiSecret)) {
            return null;
        }

        try {
            $svc = new RoomServiceClient($this->host, $this->apiKey, $this->apiSecret);

            $opts = (new RoomCreateOptions())
                ->setName($roomName)
                ->setEmptyTimeout($emptyTimeout)
                ->setMaxParticipants($maxParticipants);

            return $svc->createRoom($opts);
        } catch (\Throwable $e) {
            // LiveKit automatically provisions rooms when participants connect with a valid token
            logger()->info('LiveKit ensureRoom notice (auto-created on join): ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Start a server-side LiveKit Participant Egress for audio recording.
     *
     * The agence104/livekit-server-sdk v1.3 EgressServiceClient::startParticipantEgress()
     * has a bug: its getOutputParams() helper sets $data['file'] when EncodedFileOutput
     * has a filepath, but ParticipantEgressRequest does NOT have a 'file' field (only
     * RoomCompositeEgressRequest does). The correct field is 'file_outputs' (repeated).
     *
     * Fix: use PHP Reflection to call the protected rpc->StartParticipantEgress() directly,
     * constructing ParticipantEgressRequest with 'file_outputs' ourselves.
     */
    public function startParticipantEgress(string $roomName, string $identity, string $role): ?object
    {
        if (!$this->egressClient) {
            logger()->warning("LiveKit startParticipantEgress aborted ({$role}/{$identity}): EgressServiceClient not initialized.");
            return null;
        }

        $filepath = "recordings/{$roomName}_{$role}_{$identity}_" . time() . ".mp3";

        logger()->info("LiveKit startParticipantEgress attempting ({$role}/{$identity}): room={$roomName}, filepath={$filepath}", [
            'client_class' => get_class($this->egressClient),
            'host'         => $this->host,
            'api_key'      => substr($this->apiKey, 0, 6) . '...',
        ]);

        try {
            // Build EncodedFileOutput with the target filepath
            $fileOutput = new \Livekit\EncodedFileOutput();
            $fileOutput->setFilepath($filepath);

            // Attach Cloudflare R2 / AWS S3 upload destination if configured
            $s3Key      = config('services.livekit.s3_key') ?? env('AWS_ACCESS_KEY_ID');
            $s3Secret   = config('services.livekit.s3_secret') ?? env('AWS_SECRET_ACCESS_KEY');
            $s3Bucket   = config('services.livekit.s3_bucket') ?? env('AWS_BUCKET', 'artms-interview-recordings');
            $s3Endpoint = config('services.livekit.s3_endpoint') ?? 'https://db3b8c571e7b2bc983841f11e25e2a44.r2.cloudflarestorage.com';
            $s3Region   = config('services.livekit.s3_region') ?? 'auto';

            if (!empty($s3Key) && !empty($s3Secret)) {
                $s3Upload = new \Livekit\S3Upload([
                    'access_key'       => $s3Key,
                    'secret'           => $s3Secret,
                    'region'           => $s3Region,
                    'endpoint'         => $s3Endpoint,
                    'bucket'           => $s3Bucket,
                    'force_path_style' => true,
                ]);
                $fileOutput->setS3($s3Upload);
            }

            // Build ParticipantEgressRequest directly with the correct 'file_outputs' field.
            // The SDK helper incorrectly sets $data['file'] which is not a valid protobuf
            // field on ParticipantEgressRequest — causing UnexpectedValueException.
            $request = new \Livekit\ParticipantEgressRequest([
                'room_name'    => $roomName,
                'identity'     => $identity,
                'screen_share' => false,
                'file_outputs' => [$fileOutput],
            ]);

            // Access the protected 'rpc' property and 'authHeader()' method via Reflection
            $clientRef   = new \ReflectionObject($this->egressClient);

            $rpcProp = $clientRef->getProperty('rpc');
            $rpcProp->setAccessible(true);
            $rpc = $rpcProp->getValue($this->egressClient);

            $authMethod = $clientRef->getMethod('authHeader');
            $authMethod->setAccessible(true);

            $videoGrant = new \Agence104\LiveKit\VideoGrant();
            $videoGrant->setRoomRecord();
            $authHeader = $authMethod->invoke($this->egressClient, $videoGrant);

            logger()->info("About to call SDK StartParticipantEgress RPC for {$identity}");

            // Call the Twirp RPC — returns EgressInfo directly (not [response, status])
            $egressInfo = $rpc->StartParticipantEgress($authHeader, $request);

            logger()->info("SDK call returned for {$identity}", [
                'egressInfo_class' => $egressInfo ? get_class($egressInfo) : 'null',
                'has_getEgressId'  => $egressInfo ? method_exists($egressInfo, 'getEgressId') : false,
            ]);

            $egressId = method_exists($egressInfo, 'getEgressId') ? $egressInfo->getEgressId() : 'unknown';
            logger()->info("LiveKit startParticipantEgress SUCCESS ({$role}/{$identity}): egressId={$egressId}");
            return $egressInfo;
        } catch (\Throwable $e) {
            logger()->error("LiveKit startParticipantEgress FAILED ({$role}/{$identity})", [
                'class'   => get_class($e),
                'message' => $e->getMessage(),
                'code'    => $e->getCode(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Start a server-side LiveKit Room Composite Egress for audio recording.
     */
    public function startRoomAudioEgress(string $roomName): ?object
    {
        if (!$this->egressClient) {
            logger()->warning('LiveKit EgressServiceClient not initialized.');
            return null;
        }

        try {
            $output = new \Livekit\EncodedFileOutput([
                'filepath' => 'recordings/' . $roomName . '_' . time() . '.mp3',
            ]);

            $egressInfo = $this->egressClient->startRoomCompositeEgress(
                roomName:  $roomName,
                layout:    'single-speaker',
                output:    $output,
                audioOnly: true
            );

            return $egressInfo;
        } catch (\Throwable $e) {
            logger()->info('LiveKit startRoomAudioEgress notice: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Stop active egress by ID.
     */
    public function stopEgress(string $egressId): bool
    {
        if (empty($this->apiKey) || empty($this->apiSecret) || empty($egressId)) {
            return false;
        }

        try {
            $egressSvc = new \Agence104\LiveKit\EgressServiceClient($this->host, $this->apiKey, $this->apiSecret);
            $egressSvc->stopEgress($egressId);
            return true;
        } catch (\Throwable $e) {
            logger()->warning('LiveKit stopEgress error: ' . $e->getMessage());
            return false;
        }
    }
}

