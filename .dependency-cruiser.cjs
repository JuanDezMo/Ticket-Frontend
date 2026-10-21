/**
 * Reglas de capas (ver docs/architecture.md, sección 4).
 * Flujo: page -> component -> hook -> api | store -> shared/api/http-client.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Sin dependencias circulares.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'shared-not-features',
      severity: 'error',
      comment: 'shared nunca importa de features.',
      from: { path: '^src/shared/' },
      to: { path: '^src/features/' },
    },
    {
      name: 'only-app-imports-app',
      severity: 'error',
      comment: 'Solo src/app (y las pruebas) usan el arranque de la aplicación.',
      from: { path: '^src/(shared|features)/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'feature-public-api',
      severity: 'error',
      comment: 'Una feature solo importa de otra por su index.ts.',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/[^/]+/',
        pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'app-uses-feature-index',
      severity: 'error',
      comment: 'src/app solo importa de una feature por su index.ts.',
      from: { path: '^src/app/' },
      to: { path: '^src/features/', pathNot: '^src/features/[^/]+/index\\.ts$' },
    },
    {
      name: 'ui-not-api',
      severity: 'error',
      comment: 'Componentes y páginas no llaman a la API: usan un hook.',
      from: { path: '^src/(features/[^/]+/(components|pages)|shared/ui)/' },
      to: { path: '(^src/features/[^/]+/api\\.ts$)|(^src/shared/api/http-client\\.ts$)' },
    },
    {
      name: 'api-without-react',
      severity: 'error',
      comment: 'api.ts solo hace HTTP: no conoce React.',
      from: { path: '^src/features/[^/]+/api\\.ts$' },
      to: { path: 'node_modules/(react|react-dom|@tanstack|zustand)/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // Las pruebas pueden armar cualquier combinación
    exclude: { path: '(\\.test\\.tsx?$)|(^src/test/)' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.d.ts'],
    },
  },
};
