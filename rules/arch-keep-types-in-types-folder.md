---
title: Keep Types and Interfaces in Types Folders
impact: MEDIUM-HIGH
impactDescription: Improves maintainability by keeping services and controllers focused on behavior
tags: architecture, types, interfaces, organization
---

## Keep Types and Interfaces in Types Folders

When a `type` or `interface` is needed, define it in a dedicated file inside the feature module's `types/` folder. Do not define reusable or request/response-shaping types inline inside services or controllers. If an existing service or controller contains a `type` or `interface`, move it to the nearest feature-level `types/` folder and import it.

This keeps NestJS services focused on business behavior, controllers focused on HTTP orchestration, and shared contracts easy to find, reuse, and test. Inline types are acceptable only for truly local implementation details that are not exported, not reused, and not part of a controller/service public method contract.

**Incorrect (types and interfaces defined inside services or controllers):**

```typescript
// users/users.service.ts
interface FindActiveUsersOptions {
  includeDeleted?: boolean;
  limit?: number;
}

type UserWithOrderCount = User & {
  orderCount: number;
};

@Injectable()
export class UsersService {
  async findActive(
    options: FindActiveUsersOptions,
  ): Promise<UserWithOrderCount[]> {
    // Business logic mixed with contract definitions
  }
}

// users/users.controller.ts
interface CreateUserResponse {
  id: string;
  email: string;
}

@Controller('users')
export class UsersController {
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponse> {
    return this.usersService.create(dto);
  }
}
```

**Correct (types live in the feature module's types folder):**

```typescript
// users/types/find-active-users-options.type.ts
export interface FindActiveUsersOptions {
  includeDeleted?: boolean;
  limit?: number;
}

// users/types/user-with-order-count.type.ts
export type UserWithOrderCount = User & {
  orderCount: number;
};

// users/types/create-user-response.type.ts
export interface CreateUserResponse {
  id: string;
  email: string;
}

// users/users.service.ts
import { FindActiveUsersOptions } from './types/find-active-users-options.type';
import { UserWithOrderCount } from './types/user-with-order-count.type';

@Injectable()
export class UsersService {
  async findActive(
    options: FindActiveUsersOptions,
  ): Promise<UserWithOrderCount[]> {
    // Service stays focused on business behavior
  }
}

// users/users.controller.ts
import { CreateUserResponse } from './types/create-user-response.type';

@Controller('users')
export class UsersController {
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponse> {
    return this.usersService.create(dto);
  }
}
```

**Recommended structure:**

```typescript
src/
├── users/
│   ├── dto/
│   ├── entities/
│   ├── types/
│   │   ├── create-user-response.type.ts
│   │   ├── find-active-users-options.type.ts
│   │   └── user-with-order-count.type.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
└── orders/
    ├── types/
    └── orders.service.ts
```

Prefer descriptive filenames that match the exported contract. Use `.type.ts` for both `type` aliases and interfaces when the file's purpose is a shared TypeScript contract. Keep DTO classes in `dto/`; reserve `types/` for plain TypeScript `type` and `interface` definitions.

Reference: [NestJS Modules](https://docs.nestjs.com/modules)
