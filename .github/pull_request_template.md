# Pull Request

## Description
<!-- Brief description of what this PR does -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## 🧪 QA Checklist (MANDATORY)

**A feature is NOT ready to ship unless ALL boxes are checked:**

### Visual Testing
- [ ] ✅ **Light mode works** - Tested in light theme, all elements visible and properly styled
- [ ] ✅ **Dark mode works** - Tested in dark theme, all elements visible and properly styled
- [ ] ✅ **Mobile viewport works** - Tested on mobile breakpoint (375px, 768px), responsive layout correct
- [ ] ✅ **Tablet viewport works** - Tested on tablet breakpoint (1024px), layout adapts correctly

### Functional Testing
- [ ] ✅ **Exports render correctly** - PDF/CSV exports tested, styling correct, no broken elements
- [ ] ✅ **Navigation works** - Can navigate to/from the feature, back button works
- [ ] ✅ **Empty states handled** - Tested with no data, appropriate messages shown
- [ ] ✅ **Error states handled** - Tested error scenarios, user-friendly error messages displayed
- [ ] ✅ **Loading states** - Loading indicators shown during async operations

### Technical Quality
- [ ] ✅ **No console errors** - Browser console checked, no errors or warnings
- [ ] ✅ **No console warnings** - Cleaned up all development warnings
- [ ] ✅ **TypeScript passes** - `npm run type-check` passes with no errors
- [ ] ✅ **Linting passes** - `npm run lint` passes with no errors
- [ ] ✅ **Build succeeds** - `npm run build` completes successfully

### Accessibility
- [ ] ✅ **Keyboard navigation works** - All interactive elements accessible via keyboard
- [ ] ✅ **Focus states visible** - Clear focus indicators on all interactive elements
- [ ] ✅ **ARIA labels present** - Screen reader friendly labels on buttons/inputs

### Performance
- [ ] ✅ **No performance regressions** - Page load time acceptable (<3s)
- [ ] ✅ **Images optimized** - All images properly sized and optimized

## 📸 Screenshots

### Light Mode
<!-- Add screenshot of feature in light mode -->

### Dark Mode
<!-- Add screenshot of feature in dark mode -->

### Mobile View
<!-- Add screenshot of feature on mobile viewport -->

## 🧪 Testing Evidence

### Manual Testing
<!-- Describe manual testing performed -->

### Automated Tests
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated (Playwright)
- [ ] All tests pass: `npm run test:e2e`

## 🔗 Related Issues
Closes #<!-- issue number -->

## 📝 Deployment Notes
<!-- Any special deployment considerations? Database migrations? Environment variables? -->

## 👀 Reviewer Checklist
- [ ] Code follows project conventions
- [ ] QA checklist completed by author
- [ ] Changes tested locally
- [ ] Documentation updated if needed
- [ ] No sensitive data exposed

---

**⚠️ If any QA checklist item is unchecked, this PR is NOT ready to merge.**
