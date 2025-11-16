"use client";

import { useEffect } from "react";

type Props = { value: any; label?: string };

export default function LinksLogger({ value, label = "Album links" }: Props) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(label + ":", value);
  }, [label, value]);
  return null;
}


