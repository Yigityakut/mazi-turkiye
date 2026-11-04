// https://docs.expo.dev/router/reference/static-rendering/#root-html
import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
import type { ReactNode } from "react";

/**
 * Web kök HTML'i. Sayfa dili Türkçe: tarayıcı `text-transform: uppercase`'i Türkçe kurallarla yapsın
 * ("Günlük seri" → "GÜNLÜK SERİ", "i" → "İ").
 *
 * Not: Şu anki web derlemesi tek sayfalık (`web.output: "single"`); orada bu dosya kullanılmaz ve dil
 * `app.config.ts` → `web.lang: "tr"` ile verilir. Bu dosya `output: "static" | "server"`e geçilirse devreye girer.
 */
export default function Root({ children }: { children: ReactNode }) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();
  return (
    <html {...htmlAttributes} lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
