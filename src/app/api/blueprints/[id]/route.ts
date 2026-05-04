// @ts-nocheck
/**
 * GET /api/blueprints/:id
 *
 * Returns a blueprint scoped by session_id.
 * No auth required — session scoping provides isolation.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildErrorResponse,
  buildSuccessResponse,
  handleUnknownError,
  SETU_ERROR_CODES,
} from "@/lib/errors/setu-errors";
import { getBlueprintById } from "@/lib/services/conversation.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: blueprintId } = await params;

  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        buildErrorResponse(
          SETU_ERROR_CODES.INPUT_MISSING,
          "session_id query parameter is required."
        ),
        { status: 400 }
      );
    }

    const blueprint = await getBlueprintById(blueprintId, sessionId);

    if (!blueprint) {
      return NextResponse.json(
        buildErrorResponse(
          SETU_ERROR_CODES.PERMISSION_DENIED,
          "Blueprint not found."
        ),
        { status: 404 }
      );
    }

    return NextResponse.json(buildSuccessResponse(blueprint));
  } catch (error) {
    return NextResponse.json(
      handleUnknownError(error, `GET /api/blueprints/${blueprintId}`),
      { status: 500 }
    );
  }
}
