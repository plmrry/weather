import React from "react";

export function LoadingSpinner(): React.JSX.Element {
  return (
    <div
      aria-label="Loading"
      className="absolute inset-0 flex items-center justify-center bg-transparent"
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-4 border-white border-r-transparent"
      />
    </div>
  );
}
