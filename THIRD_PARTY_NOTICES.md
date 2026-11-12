# Avisos de software de terceros (THIRD_PARTY_NOTICES)

> **No es asesoría legal ni afirma cumplimiento.** Lo generó una herramienta a partir de los metadatos y archivos de licencia de los paquetes instalados. Conviene que un abogado lo revise.

**Alcance.** Dependencias de **producción** (directas y transitivas) del `package.json` de la raíz, obtenidas con `pnpm@10 licenses list --prod --json` sobre `node_modules/.pnpm` tal como está instalado (112 paquete@versión). **No incluye**: `backend/` (tiene su propio `package.json`), `media-worker/`, dependencias de desarrollo, ni binarios opcionales de otras plataformas (macOS/Windows/ARM) que no estaban instalados en esta máquina Linux x64. Las fuentes y los íconos están en [CREDITS.md](./CREDITS.md).

**Regenerar:** `pnpm licenses list --prod --json` y volver a revisar a mano.

## 1. Resumen

| Licencia | Paquetes |
|---|---|
| MIT | 86 |
| ISC | 14 |
| Apache-2.0 | 7 |
| LGPL-3.0-or-later | 1 |
| CC-BY-4.0 | 1 |
| BSD-3-Clause | 1 |
| 0BSD | 1 |
| BSD-2-Clause | 1 |

## 2. Licencias marcadas para REVISIÓN

No se encontró ninguna GPL, AGPL, MPL ni «UNKNOWN» **como licencia declarada de un paquete**. Se marcan estas, por precaución:

| Paquete | Licencia | Por qué se marca |
|---|---|---|
| @img/sharp-libvips-linux-x64 1.3.2 | **LGPL-3.0-or-later** (copyleft débil) | Es el binario precompilado de libvips (`libvips-cpp.so`) que usa `sharp`. Su README declara además componentes bajo **MPL-2.0 (cairo)**, **LGPLv3** (fribidi, glib, libexif, libheif, librsvg, libvips, pango, proxy-libintl), BSD, MIT, zlib/IJG/libpng/libtiff/freetype, y aom con la *Alliance for Open Media Patent License 1.0*. Es una librería dinámica separada, no código del proyecto; las obligaciones del LGPL/MPL (aviso, texto de licencia, posibilidad de sustituir la librería, acceso al código fuente de esas librerías) **dependen de cómo se distribuya** la app. Entra como dependencia **opcional** de `next` (no está en `package.json`; `sharp` aparece en `pnpm-workspace.yaml:9`). **No se verificó** si el despliegue en Cloudflare (OpenNext) empaqueta este binario. Revisar con el abogado. |
| caniuse-lite 1.0.30001809 | **CC-BY-4.0** | No es una licencia de software; exige **atribución** (datos de «Can I use», Alexis Deveria y colaboradores) y indicar si se modificó. Se incluye abajo el aviso, pero valorar si basta (suele ser dependencia de herramienta de build, no de runtime; no se verificó). |
| @paddle/paddle-js 1.4.2, @paddle/paddle-node-sdk 3.2.0 | Apache-2.0 | Licencia permisiva; se destaca porque son los SDK de pago. Apache-2.0 exige conservar el texto de licencia y los avisos; **no se halló archivo NOTICE** en ningún paquete Apache. |
| @img/sharp-linux-x64 0.35.3, sharp 0.35.3 | Apache-2.0 | Idem. |

Paquetes **sin archivo de licencia dentro del paquete** (la licencia se tomó solo de `package.json`; conseguir el texto en el repositorio oficial): `@img/sharp-libvips-linux-x64@1.3.2` (LGPL-3.0-or-later), `@next/env@16.3.1` (MIT), `@next/swc-linux-x64-gnu@16.3.1` (MIT), `client-only@0.0.1` (MIT), `tr46@0.0.3` (MIT).

## 3. Tabla de paquetes

| Paquete | Versión | Licencia | Aviso de copyright (según su archivo de licencia) |
|---|---|---|---|
| @babel/code-frame | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/compat-data | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/core | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/generator | 7.29.8 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/helper-compilation-targets | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/helper-globals | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/helper-module-imports | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/helper-module-transforms | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/helper-string-parser | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/helper-validator-identifier | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/helper-validator-option | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/helpers | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors · Copyright (c) 2014-present, Facebook, Inc. (ONLY ./src/helpers/regenerator* files) |
| @babel/parser | 7.29.8 | MIT | Copyright (C) 2012-2014 by various contributors (see AUTHORS) |
| @babel/template | 7.29.7 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/traverse | 7.29.8 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/types | 7.29.8 | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @img/colour | 1.1.0 | MIT | Copyright (c) 2012 Heather Arthur · Copyright (c) 2011-2016 Heather Arthur <fayearthur@gmail.com>. · Copyright (c) 2016-2021 Josh Junon <josh@junon.me>. · Copyright (c) 2011 Heather Arthur <fayearthur@gmail.com> · Copyright (c) 2015 Dmitry Ivanov |
| @img/sharp-libvips-linux-x64 | 1.3.2 | LGPL-3.0-or-later | **sin archivo de licencia en el paquete** |
| @img/sharp-linux-x64 | 0.35.3 | Apache-2.0 | Copyright [yyyy] [name of copyright owner] |
| @jridgewell/gen-mapping | 0.3.13 | MIT | Copyright 2024 Justin Ridgewell <justin@ridgewell.name> |
| @jridgewell/remapping | 2.3.5 | MIT | Copyright 2024 Justin Ridgewell <justin@ridgewell.name> |
| @jridgewell/resolve-uri | 3.1.2 | MIT | Copyright 2019 Justin Ridgewell <jridgewell@google.com> |
| @jridgewell/sourcemap-codec | 1.5.5 | MIT | Copyright 2024 Justin Ridgewell <justin@ridgewell.name> |
| @jridgewell/trace-mapping | 0.3.31 | MIT | Copyright 2024 Justin Ridgewell <justin@ridgewell.name> |
| @next/env | 16.3.1 | MIT | **sin archivo de licencia en el paquete** |
| @next/swc-linux-x64-gnu | 16.3.1 | MIT | **sin archivo de licencia en el paquete** |
| @paddle/paddle-js | 1.4.2 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works · Copyright [yyyy] [name of copyright owner] |
| @paddle/paddle-node-sdk | 3.2.0 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works · Copyright 2024 Paddle.com Market Limited |
| @supabase/auth-js | 2.72.0 | MIT | Copyright (c) 2020 Supabase |
| @supabase/functions-js | 2.5.0 | MIT | Copyright (c) 2020 Supabase |
| @supabase/node-fetch | 2.6.15 | MIT | Copyright (c) 2016 David Frank |
| @supabase/postgrest-js | 1.21.4 | MIT | Copyright (c) 2020 Supabase |
| @supabase/realtime-js | 2.15.5 | MIT | Copyright (c) 2020 Supabase |
| @supabase/ssr | 0.7.0 | MIT | Copyright (c) 2022-2023 Supabase, Inc. |
| @supabase/storage-js | 2.12.2 | MIT | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works · Copyright [yyyy] [name of copyright owner] |
| @supabase/supabase-js | 2.58.0 | MIT | Copyright (c) 2020 Supabase |
| @swc/helpers | 0.5.23 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works · Copyright 2024 SWC contributors. |
| @types/node | 20.19.43 | MIT | Copyright (c) Microsoft Corporation. |
| @types/phoenix | 1.6.7 | MIT | Copyright (c) Microsoft Corporation. |
| @types/ws | 8.18.1 | MIT | Copyright (c) Microsoft Corporation. |
| ansi-regex | 5.0.1 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| ansi-styles | 4.3.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| baseline-browser-mapping | 2.11.15 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works · Copyright [yyyy] [name of copyright owner] |
| browserslist | 4.28.8 | MIT | Copyright 2014 Andrey Sitnik <andrey@sitnik.es> and other contributors · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| camelcase | 5.3.1 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| caniuse-lite | 1.0.30001809 | CC-BY-4.0 | copyright and certain other rights. Our licenses are · copyright--then that use is not regulated by the license. Our |
| client-only | 0.0.1 | MIT | **sin archivo de licencia en el paquete** |
| cliui | 6.0.0 | ISC | Copyright (c) 2015, Contributors |
| clsx | 2.1.1 | MIT | Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com) |
| color-convert | 2.0.1 | MIT | Copyright (c) 2011-2016 Heather Arthur <fayearthur@gmail.com> |
| color-name | 1.1.4 | MIT | Copyright (c) 2015 Dmitry Ivanov |
| convert-source-map | 2.0.0 | MIT | Copyright 2013 Thorsten Lorenz. |
| cookie | 1.1.1 | MIT | Copyright (c) 2012-2014 Roman Shtylman <shtylman@gmail.com> · Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com> |
| debug | 4.4.3 | MIT | Copyright (c) 2014-2017 TJ Holowaychuk <tj@vision-media.ca> · Copyright (c) 2018-2021 Josh Junon |
| decamelize | 1.2.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| detect-libc | 2.1.2 | Apache-2.0 | copyright notice that is included in or attached to the work · copyright license to reproduce, prepare Derivative Works of, · (c) You must retain, in the Source form of any Derivative Works · Copyright {yyyy} {name of copyright owner} |
| dijkstrajs | 1.0.3 | MIT | Copyright (C) 2008 |
| electron-to-chromium | 1.5.411 | ISC | Copyright 2018 Kilian Valkhof |
| emoji-regex | 8.0.0 | MIT | Copyright Mathias Bynens <https://mathiasbynens.be/> |
| escalade | 3.2.0 | MIT | Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com) |
| find-up | 4.1.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| gensync | 1.0.0-beta.2 | MIT | Copyright 2018 Logan Smyth <loganfsmyth@gmail.com> |
| get-caller-file | 2.0.5 | ISC | Copyright 2018 Stefan Penner |
| is-fullwidth-code-point | 3.0.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| js-tokens | 4.0.0 | MIT | Copyright (c) 2014, 2015, 2016, 2017, 2018 Simon Lydell |
| jsesc | 3.1.0 | MIT | Copyright Mathias Bynens <https://mathiasbynens.be/> |
| json5 | 2.2.3 | MIT | Copyright (c) 2012-2018 Aseem Kishore, and [others]. |
| locate-path | 5.0.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| lodash.throttle | 4.1.1 | MIT | Copyright jQuery Foundation and other contributors <https://jquery.org/> · Copyright and related rights for sample code are waived via CC0. Sample |
| lru-cache | 5.1.1 | ISC | Copyright (c) Isaac Z. Schlueter and Contributors · copyright notice and this permission notice appear in all copies. |
| lucide-react | 0.469.0 | ISC | Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022. · copyright notice and this permission notice appear in all copies. |
| ms | 2.1.3 | MIT | Copyright (c) 2020 Vercel, Inc. |
| nanoid | 3.3.18 | MIT | Copyright 2017 Andrey Sitnik <andrey@sitnik.ru> · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| next | 16.3.1 | MIT | Copyright (c) 2025 Vercel, Inc. |
| node-releases | 2.0.53 | MIT | Copyright (c) 2017 Sergey Rubanov (https://github.com/chicoxyzzy) |
| p-limit | 2.3.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| p-locate | 4.1.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| p-try | 2.2.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| papaparse | 5.5.3 | MIT | Copyright (c) 2015 Matthew Holt · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| path-exists | 4.0.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| picocolors | 1.1.1 | ISC | Copyright (c) 2021-2024 Oleksii Raspopov, Kostiantyn Denysov, Anton Verinov · copyright notice and this permission notice appear in all copies. |
| pngjs | 5.0.0 | MIT | (el archivo de licencia no incluye línea «Copyright») |
| postcss | 8.5.23 | MIT | Copyright 2013 Andrey Sitnik <andrey@sitnik.es> · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| qrcode | 1.5.4 | MIT | Copyright (c) 2012 Ryan Day |
| react | 19.2.8 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. |
| react-dom | 19.2.8 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. |
| require-directory | 2.1.1 | MIT | Copyright (c) 2011 Troy Goode <troygoode@gmail.com> |
| require-main-filename | 2.0.0 | ISC | Copyright (c) 2016, Contributors |
| scheduler | 0.27.0 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. |
| semver | 6.3.1 | ISC | Copyright (c) Isaac Z. Schlueter and Contributors · copyright notice and this permission notice appear in all copies. |
| semver | 7.8.5 | ISC | Copyright (c) Isaac Z. Schlueter and Contributors · copyright notice and this permission notice appear in all copies. |
| set-blocking | 2.0.0 | ISC | Copyright (c) 2016, Contributors |
| sharp | 0.35.3 | Apache-2.0 | Copyright [yyyy] [name of copyright owner] |
| source-map-js | 1.2.1 | BSD-3-Clause | Copyright (c) 2009-2011, Mozilla Foundation and contributors |
| string-width | 4.2.3 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| strip-ansi | 6.0.1 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| styled-jsx | 5.1.6 | MIT | Copyright (c) 2016-present Vercel, Inc. |
| tailwind-merge | 2.6.0 | MIT | Copyright (c) 2021 Dany Castillo |
| tr46 | 0.0.3 | MIT | **sin archivo de licencia en el paquete** |
| tslib | 2.8.1 | 0BSD | Copyright (c) Microsoft Corporation. |
| undici-types | 6.21.0 | MIT | Copyright (c) Matteo Collina and Undici contributors |
| update-browserslist-db | 1.3.1 | MIT | Copyright 2022 Andrey Sitnik <andrey@sitnik.es> and other contributors · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| webidl-conversions | 3.0.1 | BSD-2-Clause | Copyright (c) 2014, Domenic Denicola |
| whatwg-url | 5.0.0 | MIT | Copyright (c) 2015–2016 Sebastian Mayr |
| which-module | 2.0.1 | ISC | Copyright (c) 2016, Contributors |
| wrap-ansi | 6.2.0 | MIT | Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) |
| ws | 8.21.3 | MIT | Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com> · Copyright (c) 2013 Arnout Kazemier and contributors · Copyright (c) 2016 Luigi Pinca and contributors · COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| y18n | 4.0.3 | ISC | Copyright (c) 2015, Contributors |
| yallist | 3.1.1 | ISC | Copyright (c) Isaac Z. Schlueter and Contributors · copyright notice and this permission notice appear in all copies. |
| yargs | 15.4.1 | MIT | Copyright 2010 James Halliday (mail@substack.net); Modified work Copyright 2014 Contributors (ben@npmjs.com) |
| yargs-parser | 18.1.3 | ISC | Copyright (c) 2016, Contributors |
| zod | 3.25.76 | MIT | Copyright (c) 2025 Colin McDonnell |

## 4. Textos de licencia

Los avisos de copyright de cada paquete están en la tabla anterior. Debajo, el texto de licencia: una vez por cada variante distinta (agrupando paquetes con el mismo texto). El archivo original de cada paquete está en `node_modules/.pnpm/<paquete>@<versión>/node_modules/<paquete>/`. Enlaces oficiales: [MIT](https://opensource.org/license/mit) · [ISC](https://opensource.org/license/isc-license-txt) · [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) · [BSD-3-Clause](https://opensource.org/license/bsd-3-clause) · [BSD-2-Clause](https://opensource.org/license/bsd-2-clause) · [0BSD](https://opensource.org/license/0bsd) · [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode) · [LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.html).

### 4.1 0BSD — 1 paquete(s)

tslib@2.8.1

```
Copyright (c) Microsoft Corporation.
```

```
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### 4.2 Apache-2.0 — 7 paquete(s)

@img/sharp-linux-x64@0.35.3, @paddle/paddle-js@1.4.2, @paddle/paddle-node-sdk@3.2.0, @swc/helpers@0.5.23, baseline-browser-mapping@2.11.15, detect-libc@2.1.2, sharp@0.35.3

Texto estándar Apache License 2.0 (versión incluida en el paquete; el texto íntegro está en https://www.apache.org/licenses/LICENSE-2.0.txt). Avisos de copyright por paquete: ver la tabla de la sección 3. No hay archivos NOTICE.

### 4.3 BSD-2-Clause — 1 paquete(s)

webidl-conversions@3.0.1

```
Copyright (c) 2014, Domenic Denicola
```

```
# The BSD 2-Clause License

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### 4.4 BSD-3-Clause — 1 paquete(s)

source-map-js@1.2.1

```
Copyright (c) 2009-2011, Mozilla Foundation and contributors
```

```
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the names of the Mozilla Foundation nor the names of project
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### 4.5 CC-BY-4.0 — 1 paquete(s)

caniuse-lite@1.0.30001809

Atribución: datos de compatibilidad de navegadores de **caniuse-lite** (Browserslist / Can I use, https://caniuse.com), licenciados CC-BY-4.0. Texto completo: https://creativecommons.org/licenses/by/4.0/legalcode (el paquete incluye el texto en su archivo `LICENSE`; no se reproduce aquí por extensión).

### 4.6 ISC — 7 paquete(s)

cliui@6.0.0, electron-to-chromium@1.5.411, require-main-filename@2.0.0, set-blocking@2.0.0, which-module@2.0.1, y18n@4.0.3, yargs-parser@18.1.3

```
Copyright (c) 2015, Contributors
Copyright 2018 Kilian Valkhof
Copyright (c) 2016, Contributors
```

```
Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted, provided
that the above copyright notice and this permission notice
appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE
LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### 4.7 ISC — 4 paquete(s)

lru-cache@5.1.1, semver@6.3.1, semver@7.8.5, yallist@3.1.1

```
Copyright (c) Isaac Z. Schlueter and Contributors
copyright notice and this permission notice appear in all copies.
```

```
The ISC License

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### 4.8 ISC — 2 paquete(s)

lucide-react@0.469.0, picocolors@1.1.1

```
Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
copyright notice and this permission notice appear in all copies.
Copyright (c) 2021-2024 Oleksii Raspopov, Kostiantyn Denysov, Anton Verinov
```

```
ISC License

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### 4.9 ISC — 1 paquete(s)

get-caller-file@2.0.5

```
Copyright 2018 Stefan Penner
```

```
ISC License (ISC)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### 4.10 MIT — 43 paquete(s)

@babel/code-frame@7.29.7, @babel/compat-data@7.29.7, @babel/core@7.29.7, @babel/generator@7.29.8, @babel/helper-compilation-targets@7.29.7, @babel/helper-globals@7.29.7, @babel/helper-module-imports@7.29.7, @babel/helper-module-transforms@7.29.7, @babel/helper-string-parser@7.29.7, @babel/helper-validator-identifier@7.29.7, @babel/helper-validator-option@7.29.7, @babel/helpers@7.29.7, @babel/template@7.29.7, @babel/traverse@7.29.8, @babel/types@7.29.8, @supabase/auth-js@2.72.0, @supabase/functions-js@2.5.0, @supabase/postgrest-js@1.21.4, @supabase/ssr@0.7.0, @supabase/supabase-js@2.58.0, ansi-regex@5.0.1, ansi-styles@4.3.0, camelcase@5.3.1, clsx@2.1.1, escalade@3.2.0, find-up@4.1.0, is-fullwidth-code-point@3.0.0, locate-path@5.0.0, p-limit@2.3.0, p-locate@4.1.0, p-try@2.2.0, path-exists@4.0.0, react@19.2.8, react-dom@19.2.8, scheduler@0.27.0, string-width@4.2.3, strip-ansi@6.0.1, styled-jsx@5.1.6, tailwind-merge@2.6.0, undici-types@6.21.0, wrap-ansi@6.2.0, yargs@15.4.1, zod@3.25.76

```
Copyright (c) 2014-present Sebastian McKenzie and other contributors
Copyright (c) 2014-present, Facebook, Inc. (ONLY ./src/helpers/regenerator* files)
Copyright (c) 2020 Supabase
Copyright (c) 2022-2023 Supabase, Inc.
Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
Copyright (c) Meta Platforms, Inc. and affiliates.
Copyright (c) 2016-present Vercel, Inc.
Copyright (c) 2021 Dany Castillo
Copyright (c) Matteo Collina and Undici contributors
Copyright 2010 James Halliday (mail@substack.net); Modified work Copyright 2014 Contributors (ben@npmjs.com)
Copyright (c) 2025 Colin McDonnell
```

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### 4.11 MIT — 10 paquete(s)

@babel/parser@7.29.8, @jridgewell/gen-mapping@0.3.13, @jridgewell/remapping@2.3.5, @jridgewell/resolve-uri@3.1.2, @jridgewell/sourcemap-codec@1.5.5, @jridgewell/trace-mapping@0.3.31, color-convert@2.0.1, emoji-regex@8.0.0, gensync@1.0.0-beta.2, jsesc@3.1.0

```
Copyright (C) 2012-2014 by various contributors (see AUTHORS)
Copyright 2024 Justin Ridgewell <justin@ridgewell.name>
Copyright 2019 Justin Ridgewell <jridgewell@google.com>
Copyright (c) 2011-2016 Heather Arthur <fayearthur@gmail.com>
Copyright Mathias Bynens <https://mathiasbynens.be/>
Copyright 2018 Logan Smyth <loganfsmyth@gmail.com>
```

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### 4.12 MIT — 9 paquete(s)

@supabase/node-fetch@2.6.15, color-name@1.1.4, decamelize@1.2.0, js-tokens@4.0.0, ms@2.1.3, next@16.3.1, qrcode@1.5.4, require-directory@2.1.1, whatwg-url@5.0.0

```
Copyright (c) 2016 David Frank
Copyright (c) 2015 Dmitry Ivanov
Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
Copyright (c) 2014, 2015, 2016, 2017, 2018 Simon Lydell
Copyright (c) 2020 Vercel, Inc.
Copyright (c) 2025 Vercel, Inc.
Copyright (c) 2012 Ryan Day
Copyright (c) 2011 Troy Goode <troygoode@gmail.com>
Copyright (c) 2015–2016 Sebastian Mayr
```

```
The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 4.13 MIT — 5 paquete(s)

browserslist@4.28.8, nanoid@3.3.18, papaparse@5.5.3, postcss@8.5.23, update-browserslist-db@1.3.1

```
Copyright 2014 Andrey Sitnik <andrey@sitnik.es> and other contributors
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>
Copyright (c) 2015 Matthew Holt
Copyright 2013 Andrey Sitnik <andrey@sitnik.es>
Copyright 2022 Andrey Sitnik <andrey@sitnik.es> and other contributors
```

```
The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### 4.14 MIT — 3 paquete(s)

@types/node@20.19.43, @types/phoenix@1.6.7, @types/ws@8.18.1

```
Copyright (c) Microsoft Corporation.
```

```
MIT License

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
```

### 4.15 MIT — 2 paquete(s)

cookie@1.1.1, debug@4.4.3

```
Copyright (c) 2012-2014 Roman Shtylman <shtylman@gmail.com>
Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
Copyright (c) 2014-2017 TJ Holowaychuk <tj@vision-media.ca>
Copyright (c) 2018-2021 Josh Junon
```

```
(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### 4.16 MIT — 1 paquete(s)

@img/colour@1.1.0

```
Copyright (c) 2012 Heather Arthur
Copyright (c) 2011-2016 Heather Arthur <fayearthur@gmail.com>.
Copyright (c) 2016-2021 Josh Junon <josh@junon.me>.
Copyright (c) 2011 Heather Arthur <fayearthur@gmail.com>
Copyright (c) 2015 Dmitry Ivanov
```

```
# Licensing

## color

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## color-convert

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## color-string

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## color-name

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### 4.17 MIT — 1 paquete(s)

@supabase/realtime-js@2.15.5

```
Copyright (c) 2020 Supabase
```

```
# MIT License

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### 4.18 MIT — 1 paquete(s)

@supabase/storage-js@2.12.2

```
copyright notice that is included in or attached to the work
copyright license to reproduce, prepare Derivative Works of,
(c) You must retain, in the Source form of any Derivative Works
Copyright [yyyy] [name of copyright owner]
```

```
Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### 4.19 MIT — 1 paquete(s)

convert-source-map@2.0.0

```
Copyright 2013 Thorsten Lorenz.
```

```
All rights reserved.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```

### 4.20 MIT — 1 paquete(s)

dijkstrajs@1.0.3

```
Copyright (C) 2008
```

```
```
Dijkstra path-finding functions. Adapted from the Dijkstar Python project.

  Wyatt Baldwin <self@wyattbaldwin.com>
  All rights reserved

Licensed under the MIT license.

  http://www.opensource.org/licenses/mit-license.php

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
```

### 4.21 MIT — 1 paquete(s)

json5@2.2.3

```
Copyright (c) 2012-2018 Aseem Kishore, and [others].
```

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[others]: https://github.com/json5/json5/contributors
```

### 4.22 MIT — 1 paquete(s)

lodash.throttle@4.1.1

```
Copyright jQuery Foundation and other contributors <https://jquery.org/>
Copyright and related rights for sample code are waived via CC0. Sample
```

```
Based on Underscore.js, copyright Jeremy Ashkenas,
DocumentCloud and Investigative Reporters & Editors <http://underscorejs.org/>

This software consists of voluntary contributions made by many
individuals. For exact contribution history, see the revision history
available at https://github.com/lodash/lodash

The following license applies to all parts of this software except as
documented below:

====

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

====

code is defined as all source code displayed within the prose of the
documentation.

CC0: http://creativecommons.org/publicdomain/zero/1.0/

====

Files located in the node_modules and vendor directories are externally
maintained libraries used by this software which have their own
licenses; we recommend you read them, as their terms may differ from the
terms above.
```

### 4.23 MIT — 1 paquete(s)

node-releases@2.0.53

```
Copyright (c) 2017 Sergey Rubanov (https://github.com/chicoxyzzy)
```

```
The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### 4.24 MIT — 1 paquete(s)

pngjs@5.0.0

```
pngjs2 original work Copyright (c) 2015 Luke Page & Original Contributors
pngjs derived work Copyright (c) 2012 Kuba Niegowski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### 4.25 MIT — 1 paquete(s)

ws@8.21.3

```
Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com>
Copyright (c) 2013 Arnout Kazemier and contributors
Copyright (c) 2016 Luigi Pinca and contributors
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
```

```
Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### 4.26 LGPL-3.0-or-later (@img/sharp-libvips-linux-x64)

El paquete no trae archivo de licencia; el texto está en https://www.gnu.org/licenses/lgpl-3.0.html y, para los componentes incluidos, en el README del paquete (ver sección 2). **Pendiente de revisión.**
