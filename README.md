# pymen ERP — Frontend

Panel de administración de negocios construido con **React + Vite + TypeScript**.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## Build de producción

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
src/
├── app/                  # Vistas principales (Admin, Business)
├── components/
│   ├── features/
│   │   ├── products/     # Componentes de productos
│   │   └── sales/        # Componentes de ventas
│   ├── layout/           # Navbar y estructuras de página
│   └── ui/               # Componentes reutilizables (Modal, Input, Badge)
├── context/              # Context API (estado global)
├── hooks/                # Custom hooks
├── services/             # Datos iniciales y helpers de negocio
├── styles/               # Tokens de color / tema
└── types/                # Interfaces y tipos TypeScript
```
