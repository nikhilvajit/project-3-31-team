'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  CardHeader,
  Alert,
  Snackbar,
  Paper,
  Grid2,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Remove as RemoveIcon,
  ShoppingCart,
  Delete
} from '@mui/icons-material';
import { commonStyles } from '@/theme/style';
import { componentStyles } from '@/theme/componentStyle';
import NavigationBar from '@/components/NavigationBar';
import { useSession, getSession } from "next-auth/react";
import { FirstTimeTrackingDialog } from '@/components/FirstTimeTrackingDialog';


interface Item {
  menu_item_id: number;
  price: number;
  name: string;
  type: string;
}

interface OrderEntry {
  menuItemId: number;
  id1?: number;
  id2?: number;
  id3?: number;
  side1Id?: number;
  side2Id?: number;
  entryPrice: number;
}

interface OrderResponse {
  success: boolean;
  orderId?: number;
  message?: string;
  error?: string;
  details?: string;
}

const categories = ["Bowl", "Plate", "Bigger Plate", "A La Carte", "Appetizers & Dessert", "Drinks"];
const TAX_RATE = 0.0625;
const PREMIUM_UPCHARGE = 1.50;

const CLOUDINARY_CLOUD_NAME = "dgegmjf04";

const CashierGUI: React.FC = () => {
  const { data: session, status, update } = useSession();
  const [menuItems, setMenuItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<{ category: string, items: Item[], price: number }[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const getCloudinaryUrl = (itemName: string, itemType: string) => {
    // Determine the type prefix based on item type
    const typePrefix = 
      itemType.toLowerCase() === 'premium entree' ? 'premium_entree' :
      itemType.toLowerCase() === 'entree' ? 'entree' :
      itemType.toLowerCase() === 'side' ? 'side' :
      itemType.toLowerCase() === 'appetizer' ? 'appetizer' :
      itemType.toLowerCase() === 'dessert' ? 'dessert' :
      itemType.toLowerCase() === 'drink' ? 'drink' : 'entree';
    
    // Format the item name: remove special characters, capitalize words, join with underscores
    const formattedName = itemName
      .replace(/[^a-zA-Z0-9 ]/g, '')  // Remove special characters
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Capitalize first letter of each word
      .join('_');
  
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/${typePrefix}${formattedName}`;
  };

  useEffect(() => {
    const initSession = async () => {
      if (status === "authenticated" && !session?.user?.employeeId) {
        await update();
      }
    };
    
    initSession();
  }, [status, session?.user?.employeeId, update]);

  useEffect(() => {
    async function loadMenuItems() {
      try {
        const response = await fetch('/api/kiosk');
        if (!response.ok) throw new Error('Failed to fetch menu items');
        const items = await response.json();
        setMenuItems(items);
      } catch (err) {
        setError('Failed to load menu items');
        console.error('Error loading menu items:', err);
      }
    }
    
    loadMenuItems();
  }, []);

  // Check if this is the first time tracking for the employee
  useEffect(() => {
    const hasStartedTracking = localStorage.getItem('firstTimeTrackingDone');
    if (hasStartedTracking === 'false') {
      setIsFirstLogin(true);
    }
  }, [session]);

  const submitOrder = async () => {
    try {
      if (!session?.user?.employeeId) {
        setErrorMessage('Employee ID not found. Please log in again.');
        return;
      }
  
      const orderData = {
        employeeId: session.user.employeeId,
        price: Number(total.toFixed(2)),
        items: cart,
        customerName: null // Cashier orders don't track customer names
      };
  
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
  
      const data = await response.json();
  
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit order');
      }
  
      setShowSuccess(true);
      setCart([]);
      
    } catch (error: any) {
      console.error('Error submitting order:', error);
      setErrorMessage(error.message || 'Failed to submit order. Please try again.');
    }
  };

  // Clear selection when changing categories
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedItems([]);
  };

  const toggleSelectItem = (item: Item) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const addItemToCart = () => {
    if (["Bowl", "Plate", "Bigger Plate"].includes(selectedCategory)) {
      const sideCount = selectedItems.filter(i => i.type === 'side').length;
      const entreeCount = selectedItems.filter(i => i.type === 'entree' || i.type === 'premium entree').length;
      
      let valid = false;
      if (selectedCategory === 'Bowl' && sideCount === 1 && entreeCount === 1) valid = true;
      else if (selectedCategory === 'Plate' && sideCount === 1 && entreeCount === 2) valid = true;
      else if (selectedCategory === 'Bigger Plate' && sideCount === 1 && entreeCount === 3) valid = true;
      
      if (!valid) {
        setErrorMessage(`Please select ${
          selectedCategory === 'Bowl' ? '1 side and 1 entree' : 
          selectedCategory === 'Plate' ? '1 side and 2 entrees' : 
          '1 side and 3 entrees'
        }`);
        return;
      }
    }
  
    const categoryItem = menuItems.find(i => i.name === selectedCategory && i.type === "category");
    
    if (["A La Carte", "Appetizers & Dessert", "Drinks"].includes(selectedCategory)) {
      // Create individual entries with just the category name (not duplicating item name)
      const individualEntries = selectedItems.map(item => ({
        category: selectedCategory, // Just use the category name
        items: [item],
        price: item.price
      }));
      setCart(prev => [...prev, ...individualEntries]);
    } else if (categoryItem) {
      const premiumCount = selectedItems.filter(i => i.type === "premium entree").length;
      const premiumCharge = premiumCount * PREMIUM_UPCHARGE;
      const finalPrice = categoryItem.price + premiumCharge;
  
      setCart(prev => [...prev, { category: selectedCategory, items: selectedItems, price: finalPrice }]);
    }
  
    setSelectedItems([]);
  };

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const subtotal = cart.reduce((sum, entry) => sum + entry.price, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const renderItemSection = (title: string, items: Item[], selectionCount?: number, requiredCount?: number) => (
    <Card sx={{ mb: 4 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Typography variant="h6">
              {title}
              {requiredCount && (
                <Typography component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                  Select {requiredCount}
                </Typography>
              )}
            </Typography>
            {selectionCount !== undefined && (
              <Typography sx={{ color: 'text.secondary' }}>
                {selectionCount} of {requiredCount} selected
              </Typography>
            )}
          </Box>
        }
      />
      <CardContent sx={{ 
          maxHeight: 'calc(100vh - 200px)', // Adjust height to account for headers etc
          overflow: 'auto',
          p: 2 
        }}>
        <Grid2 container spacing={2}>
          {items.map((item) => (
            <Button
              key={item.menu_item_id}
              onClick={() => toggleSelectItem(item)}
              variant="text"
              className={selectedItems.includes(item) ? 'selected' : ''}
              sx={{
                flex: '1 1 calc(20% - 1rem)', // flex for 5 per row
                maxWidth: 'calc(20% - 1rem)',
                minWidth: '100px', // Ensure buttons don't shrink below this width
                ...componentStyles.itemButton,
                height: 'auto',
                position: 'relative',
                '&::before': selectedItems.includes(item) ? {
                  content: '"✓"',
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  bgcolor: 'white',
                  color: 'primary.main',
                  borderRadius: '50%',
                  width: '1.5rem',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                } : {},
              }}
            >
              <CardMedia
                component="img"
                src={getCloudinaryUrl(item.name, item.type)}
                alt={item.name}
                sx={{
                  height:'auto',
                  transition: 'transform 0.2s ease',
                  ...commonStyles.itemImage
                }}
              />
              <Typography variant="subtitle1" color="black">{item.name}</Typography>
              {(selectedCategory === "A La Carte" || 
                ["appetizer", "dessert", "drink"].includes(item.type))}
            </Button>
          ))}
        </Grid2>
      </CardContent>
    </Card>
  );

  const getFilteredAndGroupedItems = () => {
    if (selectedCategory === "Appetizers & Dessert") {
      const appetizers = menuItems.filter(item => item.type === "appetizer");
      const desserts = menuItems.filter(item => item.type === "dessert");
      return (
        <>
          {renderItemSection("Appetizers", appetizers)}
          {renderItemSection("Desserts", desserts)}
        </>
      );
    }
    if (selectedCategory === "Drinks") {
      return renderItemSection("Drinks", menuItems.filter(item => item.type === "drink"));
    }
    
    const sides = menuItems.filter(item => item.type === "side");
    const entrees = menuItems.filter(item => 
      item.type === "entree" || item.type === "premium entree"
    );
    const sideCount = selectedItems.filter(i => i.type === 'side').length;
    const entreeCount = selectedItems.filter(i => 
      i.type === 'entree' || i.type === 'premium entree'
    ).length;
    
    let requiredEntrees = 1;
    if (selectedCategory === "Plate") requiredEntrees = 2;
    if (selectedCategory === "Bigger Plate") requiredEntrees = 3;
    
    return (
      <>
        {renderItemSection("Sides", sides, sideCount, 1)}
        {renderItemSection("Entrees", entrees, entreeCount, requiredEntrees)}
      </>
    );
  };

  return (
    <Container 
      disableGutters 
      maxWidth={false}
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
    <FirstTimeTrackingDialog 
        open={isFirstLogin} 
        onClose={() => setIsFirstLogin(false)} 
    />
    {/* AppBar */}
    <NavigationBar />
    <div // Main Content
      style={{
          marginTop: "64px",
          overflowY: 'auto',
          marginBottom: "80px",
      }}
    >
        {/* Menus and Snackbars */}
        <Snackbar 
            open={Boolean(errorMessage)} 
            autoHideDuration={3000} 
            onClose={() => setErrorMessage('')}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setErrorMessage('')} 
              severity="error" 
              variant="filled"
            >
              {errorMessage}
            </Alert>
        </Snackbar>

        <Snackbar 
          open={showSuccess} 
          autoHideDuration={3000} 
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowSuccess(false)} 
            severity="success" 
            variant="filled"
          >
            Transaction Complete!
          </Alert>
        </Snackbar>
        <Box sx={{
            ...commonStyles.mainContainer,
          }}>
            <Box sx={{
              ...commonStyles.menuContainer,
              width: '90rem',
            }}>
              <Box sx={{
                ...commonStyles.menuContainer,
                width: '100%',
                pb: 10, // Add padding at bottom for fixed buttons
              }}>
                {/* Category Selection */}
                <Grid2 container spacing={2} sx={{ mb: 4 }}>
                  {categories.map((category) => (
                    <Grid2 key={category}>
                      <Button
                        onClick={() => handleCategoryChange(category)}
                        variant="contained"
                        sx={{
                          bgcolor: selectedCategory === category ? 'primary.main' : 'grey.200',
                          color: selectedCategory === category ? 'primary.contrastText' : 'text.primary',
                          '&:hover': {
                            bgcolor: selectedCategory === category ? 'rgb(33, 150, 243)' : 'grey.300',
                          },
                        }}
                      >
                        {category}
                      </Button>
                    </Grid2>
                  ))}
                </Grid2>

                <Box sx={{ display: 'flex', gap: 4 }}>
                  {/* Menu Sections */}
                  <Box sx={{ flex: 1 }}>
                    {getFilteredAndGroupedItems()}
                  </Box>

                  {/* Cart */}
                  <Card sx={{
                    width: '24rem',
                    height: 'fit-content',
                    bgcolor: 'background.paper',
                    mb: 4,
                  }}>

                  <CardContent>
                    <Typography variant="h6" sx={{ 
                      mb: 4,
                      fontWeight: 'bold',
                      color: 'text.primary'
                    }}>
                      Customer Order
                    </Typography>

                    <Box sx={{ 
                      minHeight: '200px',
                      maxHeight: '60vh',
                      overflow: 'auto',
                      mb: 4,
                      ...(cart.length === 0 && {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        color: 'text.secondary',
                      })
                    }}>
                      {cart.length === 0 ? (
                        <>
                          <Typography variant="h6" color="inherit">
                            Customer order is empty
                          </Typography>
                          <Typography variant="body2" color="inherit">
                            Select items to begin your order
                          </Typography>
                        </>
                      ) : (
                        cart.map((entry, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              mb: 1,
                              bgcolor: 'grey.50',
                              borderRadius: 1,
                            }}
                          >
                            <IconButton 
                              onClick={() => setCart(cart.filter((_, i) => i !== index))}
                              color="error"
                              size="small"
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Box sx={{ flex: 1, ml: 1 }}>
                              <Typography variant="body1">{entry.category}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {entry.items.map(i => i.name).join(", ")}
                              </Typography>
                            </Box>
                            <Typography variant="body1" color="black">
                              ${entry.price.toFixed(2)}
                            </Typography>
                          </Box>
                        ))
                      )}
                    </Box>
                    <Box sx={{ 
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      pt: 2,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Subtotal:</Typography>
                        <Typography>${subtotal.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Tax:</Typography>
                        <Typography>${tax.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        mb: 3,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        pt: 2
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          ${total.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={submitOrder}
                        disabled={cart.length === 0}
                        sx={{ py: 1.5 }}
                        startIcon={<ShoppingCart />}
                      >
                        Complete Sale
                      </Button>
                        <Button
                          variant="contained"
                          color="error"
                          fullWidth
                          onClick={() => setCart([])}
                          disabled={cart.length === 0}
                          sx={{ py: 1.5 }}
                          startIcon={<Delete />}
                        >
                          Clear Order
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>
        </Box>
        {/* Fixed Action Buttons */}
    </div>
    <Paper 
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            // zIndex: 1000, // not needed anymore due to div 
            p: 2,
            height: '80px', // Explicitly set height
          }}
        >
          <Box sx={{ 
            display: 'flex',
            gap: 2,
            maxWidth: '90rem',
            mx: 'auto'
          }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={addItemToCart}
              startIcon={<AddIcon />}
              disabled={selectedItems.length === 0}
              sx={{ py: 1.5 }}
            >
              Add to Order
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => setSelectedItems([])}
              startIcon={<ClearIcon />}
              disabled={selectedItems.length === 0}
              sx={{ py: 1.5 }}
            >
              Clear Selection
            </Button>
          </Box>
        </Paper>
    </Container>
  );
};

export default CashierGUI;