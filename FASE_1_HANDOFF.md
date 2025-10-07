# Fase 1: Authentication - Coding Agent Handoff

## 🎯 **Ready to Start - Fase 0 Complete & Validated**

### ✅ **Pre-requisites Met**
- **Foundation**: Next.js 15.5.4 + TypeScript + TailwindCSS 4.1.14
- **Validation**: All builds, lint, type-check, format passing
- **Structure**: Clean architecture following ARCHITECTURE.md
- **Documentation**: Complete and up-to-date
- **Branch**: `chore/fase-0-close` ready for merge

---

## 🚀 **Fase 1 Objectives (1-2 days)**

### **Primary Goal**
Implement simple passcode-based authentication system for internal VoyBien tool.

### **Key Deliverables**
1. **Login Page** (`/app/(auth)/login/page.tsx`)
2. **Authentication API** (`/app/api/auth/verify-passcode/route.ts`)
3. **Route Protection** (middleware for authenticated routes)
4. **Session Management** (JWT or secure cookies)

---

## 📋 **Technical Specifications**

### **Authentication Method**
- **Simple passcode system** (no individual user accounts)
- **Environment variable**: `INTERNAL_PASSCODE=secure_password_here`
- **Session duration**: Reasonable for internal tool (24h recommended)

### **Route Structure**
```
/app
├── (auth)/
│   └── login/
│       └── page.tsx          # Login form
├── (dashboard)/
│   ├── layout.tsx            # Protected layout
│   └── page.tsx              # Main dashboard
└── api/
    └── auth/
        └── verify-passcode/
            └── route.ts       # Authentication endpoint
```

### **Security Requirements**
- **SEO blocking**: Already implemented ✅
- **HTTPS only**: Configure in production
- **Secure session**: httpOnly cookies or secure JWT
- **Rate limiting**: Basic protection against brute force

---

## 🛠 **Implementation Guidelines**

### **1. Login Page**
- Simple form with passcode input
- Basic validation (client + server)
- Error handling for invalid credentials
- Redirect to dashboard on success

### **2. API Route**
- Compare input with `INTERNAL_PASSCODE` env var
- Generate session token (JWT recommended)
- Set secure cookie or return token
- Proper error responses

### **3. Route Protection**
- Middleware to check authentication
- Redirect to `/login` if not authenticated
- Protect all routes except `/login` and public assets

### **4. Session Management**
- Persistent session across browser sessions
- Secure token storage
- Logout functionality
- Token refresh if needed

---

## 📁 **Files to Create/Modify**

### **New Files**
- `app/(auth)/login/page.tsx` - Login form component
- `app/api/auth/verify-passcode/route.ts` - Authentication endpoint
- `middleware.ts` - Route protection
- `lib/auth.ts` - Authentication utilities

### **Modify Existing**
- `app/(dashboard)/layout.tsx` - Add authentication check
- `.env.local.example` - Add `INTERNAL_PASSCODE` variable

---

## 🎨 **UI/UX Guidelines**

### **Design Principles**
- **Simple and clean** - Internal tool aesthetics
- **VoyBien branding** - Use configured TailwindCSS colors
- **Responsive** - Mobile-friendly but desktop-optimized
- **Accessible** - Proper labels, focus states

### **Login Page Requirements**
- VoyBien logo/branding
- Single passcode input field
- "Sign In" button
- Error message display
- Loading states

---

## 🧪 **Testing Requirements**

### **Manual Testing**
- ✅ Valid passcode allows access
- ✅ Invalid passcode shows error
- ✅ Session persists across browser sessions
- ✅ Protected routes redirect to login when unauthenticated
- ✅ Logout functionality works

### **Edge Cases**
- Empty passcode submission
- Very long passcode input
- Network errors during authentication
- Expired session handling

---

## 📊 **Success Criteria**

### **Definition of Done**
- [ ] Login page renders correctly
- [ ] Valid passcode authenticates successfully
- [ ] Invalid passcode shows appropriate error
- [ ] Protected routes redirect unauthenticated users
- [ ] Session persists across browser sessions
- [ ] Logout functionality implemented
- [ ] All existing validations still pass
- [ ] Documentation updated

### **Validation Commands**
```bash
npm run lint
npm run type-check
npm run build
npm run format
```

---

## 🔗 **Next Steps After Fase 1**

Upon completion of Fase 1:
1. **Merge feature branch** to main
2. **Update progress** in WARP.md (→ 30% complete)
3. **Begin Fase 2**: Input & Scanning implementation
4. **Validate** authentication works in production environment

---

## 📚 **Reference Documentation**

- **ARCHITECTURE.md**: Technical architecture details
- **PROJECT_SETUP.md**: Development guidelines and conventions
- **MVP_ROADMAP.md**: Complete 9-phase implementation plan (see Phase 1)
- **WARP.md**: Project overview and current progress

---

**Ready for implementation!** 🚀

The foundation is solid, all validations pass, and the project is prepared for authentication implementation.