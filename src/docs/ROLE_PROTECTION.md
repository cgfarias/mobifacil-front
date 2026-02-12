# Sistema de Proteção por Roles

Este documento explica como usar o sistema de proteção por roles implementado no sistema.

## Roles Disponíveis

- **Comun**: Usuário comum - pode acessar apenas `/schedule-event`
- **Moderator**: Moderador - pode acessar todas as páginas
- **Admin**: Administrador - pode acessar todas as páginas
- **Voucher**: (Não implementado ainda)

## Como Usar

### 1. Proteção de Rotas

Use o componente `RoleProtectedRoute` para proteger rotas baseadas em roles:

```jsx
import RoleProtectedRoute from '../routes/RoleProtectedRoute';

// Rota apenas para Moderator e Admin
<Route path="/admin-panel" element={
  <RoleProtectedRoute allowedRoles={["Moderator", "Admin"]}>
    <AdminPanel />
  </RoleProtectedRoute>
} />

// Rota para todos os usuários autenticados
<Route path="/schedule-event" element={
  <RoleProtectedRoute allowedRoles={["Comun", "Moderator", "Admin"]}>
    <ScheduleEvent />
  </RoleProtectedRoute>
} />
```

### 2. Hook useRole

Use o hook `useRole` para verificar roles em componentes:

```jsx
import { useRole } from '../hooks/useRole';

const MyComponent = () => {
  const { userRole, isAdmin, isModerator, canAccess } = useRole();

  return (
    <div>
      <p>Seu role: {userRole}</p>
      
      {isAdmin() && <AdminButton />}
      
      {canAccess(['Moderator', 'Admin']) && <ModeratorPanel />}
    </div>
  );
};
```

### 3. Componente RoleGuard

Use o componente `RoleGuard` para mostrar/esconder elementos baseados em roles:

```jsx
import RoleGuard from '../components/RoleGuard';

const MyComponent = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <RoleGuard allowedRoles={["Admin"]}>
        <AdminSection />
      </RoleGuard>
      
      <RoleGuard 
        allowedRoles={["Moderator", "Admin"]}
        fallback={<p>Você não tem permissão para ver esta seção</p>}
      >
        <ModeratorSection />
      </RoleGuard>
    </div>
  );
};
```

## Comportamento das Rotas

### Usuário Comun
- ✅ Pode acessar: `/schedule-event`
- ❌ Não pode acessar: Todas as outras páginas
- 🔄 Redirecionamento: Qualquer tentativa de acessar outras páginas redireciona para `/schedule-event`

### Usuário Moderator
- ✅ Pode acessar: Todas as páginas
- 🔄 Redirecionamento: Se tentar acessar página sem permissão, vai para `/`

### Usuário Admin
- ✅ Pode acessar: Todas as páginas
- 🔄 Redirecionamento: Se tentar acessar página sem permissão, vai para `/`

## Página de Acesso Negado

Quando um usuário tenta acessar uma página sem permissão, ele pode:
1. Ser redirecionado automaticamente (comportamento padrão)
2. Ver uma página de "Acesso Negado" (usando `showAccessDenied={true}`)

```jsx
<RoleProtectedRoute 
  allowedRoles={["Admin"]} 
  showAccessDenied={true}
>
  <AdminOnlyPage />
</RoleProtectedRoute>
```

## Estrutura de Arquivos

```
src/
├── routes/
│   ├── RoleProtectedRoute.jsx    # Componente principal de proteção
│   └── PrivateRoute.jsx          # Proteção básica (sem roles)
├── hooks/
│   └── useRole.js                # Hook para verificar roles
├── components/
│   ├── RoleGuard.jsx             # Componente para mostrar/esconder elementos
│   └── pages/
│       └── AccessDenied.jsx      # Página de acesso negado
└── context/
    └── AuthContext.jsx           # Contexto de autenticação
```

## Exemplo Completo

```jsx
// App.jsx
import RoleProtectedRoute from './routes/RoleProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Página pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Página apenas para Comun */}
        <Route path="/schedule-event" element={
          <RoleProtectedRoute allowedRoles={["Comun", "Moderator", "Admin"]}>
            <ScheduleEvent />
          </RoleProtectedRoute>
        } />
        
        {/* Páginas apenas para Moderator e Admin */}
        <Route path="/" element={
          <RoleProtectedRoute allowedRoles={["Moderator", "Admin"]}>
            <Home />
          </RoleProtectedRoute>
        } />
        
        <Route path="/drivers" element={
          <RoleProtectedRoute allowedRoles={["Moderator", "Admin"]}>
            <Drivers />
          </RoleProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
```
