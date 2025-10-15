import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";
import type {
  VideoAssetCreatedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
  VideoAssetDeletedWebhookEvent,
} from "@mux/mux-node/resources/webhooks";

import { mux } from "@/lib/mux";
import { db } from "@/server/db";
import { videos } from "@/server/db/schema";
import { env } from "@/env";

const SIGNING_SECRET = env.MUX_WEBHOOK_SECRET;

type WebhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent;

type WebhookPayload = {
  type: WebhookEvent["type"];
  data: unknown;
};

export const POST = async (request: Request) => {
  if (!SIGNING_SECRET) {
    throw new Error("MUX_WEBHOOK_SECRET is not set");
  }

  const headersPayload = await headers();
  const muxSignature = headersPayload.get("mux-signature");

  if (!muxSignature) {
    return new Response("No signature found", { status: 401 });
  }

  const payload = (await request.json()) as WebhookPayload;
  const body = JSON.stringify(payload);

  mux.webhooks.verifySignature(
    body,
    {
      "mux-signature": muxSignature,
    },
    SIGNING_SECRET,
  );

  switch (payload.type) {
    case "video.asset.created": {
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];

      if (!data.upload_id) {
        return new Response("No upload ID found", { status: 400 });
      }

      console.log("Creating video: ", { uploadId: data.upload_id });

      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }

    case "video.asset.ready":
      {
        const data = payload.data as VideoAssetReadyWebhookEvent["data"];
        const playbackId = data.playback_ids?.[0]?.id;

        if (!data.upload_id) {
          return new Response("Missing upload ID", { status: 400 });
        }

        if (!playbackId) {
          return new Response("Missing playback ID", { status: 400 });
        }

        const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.png`;
        const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
        const duration = Math.round(data.duration ?? 0 * 1000);

        const utapi = new UTApi();

        const [uploadedThumbnail, uploadedPreviewUrl] =
          await utapi.uploadFilesFromUrl([tempPreviewUrl, tempThumbnailUrl]);

        if (!uploadedThumbnail?.data || !uploadedPreviewUrl?.data) {
          return new Response("Failed to upload thumbnail or preview", {
            status: 500,
          });
        }

        const { key: thumbnailKey, ufsUrl: thumbnailUrl } =
          uploadedThumbnail.data;

        const { key: previewKey, ufsUrl: previewUrl } = uploadedThumbnail.data;

        await db
          .update(videos)
          .set({
            muxStatus: data.status,
            muxPlaybackId: playbackId,
            muxAssetId: data.id,
            duration,
            previewUrl,
            previewKey,
            thumbnailUrl,
            thumbnailKey,
          })
          .where(eq(videos.muxUploadId, data.upload_id));
      }
      break;

    case "video.asset.errored": {
      const data = payload.data as VideoAssetErroredWebhookEvent["data"];

      if (!data.upload_id) {
        return new Response("No video upload Id", { status: 400 });
      }

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }

    case "video.asset.deleted": {
      const data = payload.data as VideoAssetDeletedWebhookEvent["data"];

      if (!data.upload_id) {
        return new Response("No video upload Id", { status: 400 });
      }

      await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));
      break;
    }

    case "video.asset.track.ready": {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
        asset_id: string;
      };

      console.log("Track ready");

      const assetId = data.asset_id;
      const trackId = data.id;
      const status = data.status;

      if (!data.asset_id) {
        return new Response("No video upload Id", { status: 400 });
      }

      await db
        .update(videos)
        .set({ muxTrackId: trackId, muxTrackStatus: status })
        .where(eq(videos.muxAssetId, assetId));
    }
  }

  return new Response("Webhook received", { status: 200 });
};
