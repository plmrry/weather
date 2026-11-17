"use client";

import { catchError } from "next/error";

export const ErrorBoundary = catchError(() => null);
