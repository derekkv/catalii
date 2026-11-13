> **Catalii es un proyecto escolar.** Los textos legales se redujeron a tres páginas cortas
> (`/privacidad`, `/terminos`, `/contacto`) que solo afirman lo que el código hace. No son
> asesoría legal, no dicen que la app cumpla ninguna normativa y ya no hay nada pendiente de
> un abogado. Esta nota sustituye a la lista anterior de 35 campos y 22 decisiones jurídicas.

# Datos que faltan

**Quedan 3 campos**, todos en `COMPANY`, dentro de `src/lib/legal/config.ts`:

| Campo | Qué es | Ejemplo |
|---|---|---|
| `owner` | Quién responde del proyecto: tu nombre o el del equipo | `Derek K. / Equipo 4` |
| `contactEmail` | Correo de contacto, que debe existir y estar atendido | `catalii.escolar@gmail.com` |
| `institution` | Institución o materia en la que se presenta | `Desarrollo Web, Universidad X` |

Al guardar, se actualizan las tres páginas del sitio y los Markdown de `docs/legal/textos/`:

```bash
pnpm legal:export      # regenera los .md y lista los campos vacíos
```

Mientras un campo siga en `[COMPLETAR]`, su página avisa «Documento incompleto» arriba y se
sirve con `noindex`. Al rellenar los tres, el aviso desaparece y las páginas pasan a ser
indexables sin tocar código. El aviso de proyecto escolar, en cambio, se queda siempre: es
parte del texto.
