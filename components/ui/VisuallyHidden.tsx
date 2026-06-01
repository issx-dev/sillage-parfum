"use client";

import * as React from "react";

const VisuallyHidden: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  ...props
}) => (
  <span
    className="sr-only"
    {...props}
  >
    {children}
  </span>
);

export { VisuallyHidden };