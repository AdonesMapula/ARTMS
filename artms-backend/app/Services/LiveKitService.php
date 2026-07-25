<?php

namespace App\Services;

use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\RoomServiceClient;
use Agence104\LiveKit\VideoGrant;

class LiveKitService
{
    private string $apiKey;
    private string $apiSecret;
    private string $host;

    public function __construct()
    {
        $this->apiKey    = config('services.livekit.key') ?? '';
        $this->apiSecret = config('services.livekit.secret') ?? '';
        $rawHost         = config('services.livekit.host') ?? 'https://cloud.livekit.io';
        
        // RoomServiceClient requires HTTP/HTTPS scheme for REST API requests
        $this->host      = str_replace(['wss://', 'ws://'], ['https://', 'http://'], $rawHost);
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
}

