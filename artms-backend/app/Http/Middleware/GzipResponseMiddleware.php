<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * GzipResponseMiddleware
 *
 * Compresses JSON and text API responses with gzip if the client supports it,
 * adds ETag headers for caching, and ensures optimal throughput.
 */
class GzipResponseMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Only compress if response is successful and has content
        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return $response;
        }

        $content = $response->getContent();
        if ($content === false || strlen($content) < 1024) {
            // Content under 1KB is faster uncompressed
            return $response;
        }

        // Add ETag for conditional GET / 304 Not Modified
        $etag = md5($content);
        $response->headers->set('ETag', '"' . $etag . '"');

        if ($request->header('If-None-Match') === '"' . $etag . '"') {
            $response->setStatusCode(304);
            $response->setContent('');
            return $response;
        }

        // Check if client accepts gzip and zlib is available
        $acceptEncoding = $request->header('Accept-Encoding', '');
        if (str_contains($acceptEncoding, 'gzip') && function_exists('gzencode') && !ini_get('zlib.output_compression')) {
            $compressed = gzencode($content, 6);
            if ($compressed !== false) {
                $response->setContent($compressed);
                $response->headers->set('Content-Encoding', 'gzip');
                $response->headers->set('Content-Length', (string) strlen($compressed));
                $response->headers->set('Vary', 'Accept-Encoding', false);
            }
        }

        return $response;
    }
}
