"use client";

import React from "react";
import type { VariantProps } from "class-variance-authority";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cva } from "class-variance-authority";

function FieldSet({ children }: { children?: React.ReactNode }) {
  return (
    <fieldset
      className="flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3"
      data-slot="field-set"
    >
      {children}
    </fieldset>
  );
}

function FieldLegend({
  children,
  variant = "legend",
}: {
  children?: React.ReactNode;
  variant?: "label" | "legend";
}) {
  return (
    <legend
      className="mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base"
      data-slot="field-legend"
      data-variant={variant}
    >
      {children}
    </legend>
  );
}

function FieldGroup({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="group/field-group @container/field-group grid w-full grid-cols-1 gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4"
      data-slot="field-group"
    >
      {children}
    </div>
  );
}

const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  {
    defaultVariants: {
      orientation: "vertical",
    },
    variants: {
      orientation: {
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
      },
    },
  },
);

function Field({
  children,
  orientation = "vertical",
}: { children?: React.ReactNode } & VariantProps<typeof fieldVariants>) {
  return (
    <div
      className={fieldVariants({ orientation })}
      data-orientation={orientation}
      data-slot="field"
      role="group"
    >
      {children}
    </div>
  );
}

function FieldContent({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="group/field-content flex flex-1 flex-col gap-0.5 leading-snug"
      data-slot="field-content"
    >
      {children}
    </div>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children?: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      className="group/field-label peer/field-label flex w-fit items-center gap-2 text-sm leading-snug font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10"
      data-slot="field-label"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function FieldTitle({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50"
      data-slot="field-label"
    >
      {children}
    </div>
  );
}

function FieldDescription({ children }: { children?: React.ReactNode }) {
  return (
    <p
      className="text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance last:mt-0 nth-last-2:-mt-1 [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary [[data-variant=legend]+&]:-mt-1.5"
      data-slot="field-description"
    >
      {children}
    </p>
  );
}

function FieldSeparator({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2"
      data-content={!!children}
      data-slot="field-separator"
    >
      <SeparatorPrimitive
        className="absolute inset-0 top-1/2 h-px w-full shrink-0 bg-border"
        orientation="horizontal"
      />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  children,
  errors,
}: {
  children?: React.ReactNode;
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = React.useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>,
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      className="text-sm font-normal text-destructive"
      data-slot="field-error"
      role="alert"
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};
