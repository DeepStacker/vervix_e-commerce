# 🧪 Testing Guide: Enhanced Vervix Ecommerce Features

## 🚀 Quick Start for Testing

### Prerequisites
- Node.js and MongoDB running
- Both backend and frontend servers started
- User account created and logged in

### 🎯 Test Scenarios

## 1. Order History Testing

### **Basic Order History Access**
1. Navigate to `/orders` (or click Order History in user menu)
2. ✅ **Expected:** Page loads with order list or empty state
3. ✅ **Test:** Responsive design on mobile/tablet

### **Order Filtering & Search**
1. Click "Filters" button
2. Test status dropdown: Select "Delivered"
3. Test search: Enter order number or product name
4. Test date range: Select "Last 30 days"
5. ✅ **Expected:** Orders filter correctly with URL updates

### **Reorder Functionality**
1. Find a completed order with "Reorder" button
2. Click "Reorder"
3. ✅ **Expected:** Confirmation dialog appears
4. Confirm reorder
5. ✅ **Expected:** Success message + option to go to cart
6. ✅ **Expected:** Items added to cart (check cart page)

### **Pagination Testing**
1. If you have multiple pages of orders
2. Test "Next" and "Previous" buttons
3. Test direct page number clicks
4. ✅ **Expected:** Smooth navigation with loading states

---

## 2. Wishlist Testing

### **Wishlist Basic Functionality**
1. Navigate to `/wishlist`
2. ✅ **Expected:** Page loads with wishlist items or empty state
3. Add items to wishlist from product pages first if empty

### **View Mode Toggle**
1. Click grid/list view toggle buttons
2. ✅ **Expected:** Layout changes between grid and list view

### **Individual Item Actions**
1. **Move to Cart:** Click "Move to Cart" on any item
2. ✅ **Expected:** Item moves to cart, removed from wishlist
3. **Remove Item:** Click trash icon
4. ✅ **Expected:** Item removed with confirmation

### **Bulk Operations**
1. Click "Select Items" button
2. ✅ **Expected:** Checkboxes appear on items
3. Select multiple items
4. Click "Select All" to select everything
5. Use bulk "Move to Cart" button
6. ✅ **Expected:** Selected items move to cart
7. Use bulk "Remove" button
8. ✅ **Expected:** Selected items removed with confirmation

### **Clear All Wishlist**
1. Click "Clear All" button
2. ✅ **Expected:** Confirmation dialog
3. Confirm action
4. ✅ **Expected:** All items removed, empty state shown

---

## 3. Enhanced Cart Testing

### **Cart Item Management**
1. Navigate to `/cart`
2. Add items to cart if empty
3. **Quantity Updates:** Use +/- buttons
4. ✅ **Expected:** Live price updates, optimistic UI
5. **Remove Items:** Click trash icon
6. ✅ **Expected:** Item removed with animation

### **Cart Summary**
1. Verify subtotal calculation
2. Check shipping calculation (free over $100)
3. Check tax calculation (8%)
4. ✅ **Expected:** All math is correct and updates live

### **Error Handling**
1. Try to update quantity to invalid number
2. Try to add more items than in stock
3. ✅ **Expected:** Appropriate error messages shown

---

## 4. API Endpoint Testing

### **Backend API Tests** (Use Postman or curl)

#### **Reorder Endpoint**
```bash
POST /api/orders/:orderId/reorder
Authorization: Bearer YOUR_JWT_TOKEN
```
✅ **Expected:** 200 with cart update details

#### **Wishlist Bulk Operations**
```bash
# Clear wishlist
DELETE /api/users/wishlist
Authorization: Bearer YOUR_JWT_TOKEN

# Move to cart
POST /api/users/wishlist/move-to-cart
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
{
  "productIds": ["product1", "product2"],
  "moveAll": false
}

# Get wishlist count
GET /api/users/wishlist/count
Authorization: Bearer YOUR_JWT_TOKEN
```

#### **Cart Endpoints**
```bash
# Update quantity
PUT /api/cart/update/:itemId
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
{
  "quantity": 3
}

# Remove item
DELETE /api/cart/remove/:itemId
Authorization: Bearer YOUR_JWT_TOKEN

# Clear cart
DELETE /api/cart/clear
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 5. Error Scenarios Testing

### **Network Errors**
1. Disconnect internet
2. Try to perform actions
3. ✅ **Expected:** Meaningful error messages

### **Authorization Errors**
1. Log out and try to access protected pages
2. ✅ **Expected:** Redirect to login

### **Product Availability**
1. Try to reorder items that are out of stock
2. ✅ **Expected:** Detailed response about unavailable items

---

## 6. Performance Testing

### **Loading States**
1. Watch for skeleton loaders during data fetching
2. ✅ **Expected:** Smooth loading transitions

### **Optimistic Updates**
1. Update cart quantities rapidly
2. ✅ **Expected:** Immediate UI updates, no flickering

### **Large Data Sets**
1. Test with many orders/wishlist items
2. ✅ **Expected:** Pagination works smoothly

---

## 7. Mobile Testing

### **Responsive Design**
1. Test on mobile devices or browser dev tools
2. ✅ **Expected:** All features work on mobile
3. ✅ **Expected:** Touch-friendly buttons and interactions

### **Touch Interactions**
1. Test swipe gestures (if implemented)
2. Test tap vs long press
3. ✅ **Expected:** Intuitive mobile experience

---

## 8. Accessibility Testing

### **Keyboard Navigation**
1. Use Tab key to navigate through interface
2. ✅ **Expected:** All interactive elements reachable
3. ✅ **Expected:** Clear focus indicators

### **Screen Reader Testing**
1. Use browser screen reader or NVDA/JAWS
2. ✅ **Expected:** All content and actions announced properly

---

## 🐛 Common Issues to Watch For

### **Backend Issues**
- ❌ 500 errors on API calls
- ❌ Incorrect data returned
- ❌ Authorization failures
- ❌ Database connection issues

### **Frontend Issues**
- ❌ Components not rendering
- ❌ State not updating correctly
- ❌ Navigation issues
- ❌ Console errors

### **Integration Issues**
- ❌ API endpoint mismatches
- ❌ Data format inconsistencies
- ❌ Authentication token issues

---

## 🔧 Debugging Tips

### **Frontend Debugging**
```javascript
// Check React Query cache
// Open browser dev tools console
window.queryClient.getQueriesData()

// Check context state
// Add console.log in context providers
console.log('Cart state:', state);
```

### **Backend Debugging**
```javascript
// Add logging to API endpoints
console.log('Request body:', req.body);
console.log('User:', req.user);
```

### **Network Debugging**
1. Open browser Network tab
2. Monitor API calls
3. Check request/response data
4. Look for failed requests

---

## ✅ Test Completion Checklist

### **Order History**
- [ ] Page loads correctly
- [ ] Filtering works (status, search, date)
- [ ] Pagination functions
- [ ] Reorder works end-to-end
- [ ] View details navigation
- [ ] Loading states show
- [ ] Error handling works
- [ ] Mobile responsive

### **Wishlist**
- [ ] Page loads correctly
- [ ] Grid/list view toggle
- [ ] Individual move to cart
- [ ] Individual remove
- [ ] Bulk selection mode
- [ ] Bulk move to cart
- [ ] Bulk remove
- [ ] Clear all functionality
- [ ] Empty state display
- [ ] Loading states show
- [ ] Error handling works
- [ ] Mobile responsive

### **Cart**
- [ ] Page loads correctly
- [ ] Quantity updates work
- [ ] Remove items work
- [ ] Clear cart works
- [ ] Price calculations correct
- [ ] Loading states show
- [ ] Error handling works
- [ ] Optimistic updates
- [ ] Mobile responsive

### **API Integration**
- [ ] All endpoints respond correctly
- [ ] Authentication works
- [ ] Error responses formatted properly
- [ ] Data validation working

---

## 📊 Performance Benchmarks

### **Target Metrics**
- **Page Load Time:** < 3 seconds
- **API Response Time:** < 500ms
- **UI Update Time:** < 100ms (optimistic updates)
- **Error Recovery Time:** < 1 second

### **Monitoring Tools**
- Browser Performance tab
- React Query DevTools
- Network tab for API monitoring
- Lighthouse for overall performance

---

## 🎉 Success Criteria

The implementation is successful when:
- ✅ All test scenarios pass
- ✅ No console errors
- ✅ Responsive design works on all devices
- ✅ Accessibility standards met
- ✅ Performance targets achieved
- ✅ User experience is smooth and intuitive

---

**Happy Testing!** 🚀

If you encounter any issues during testing, check:
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. Server logs for backend errors
4. Redux/Context state in React DevTools
