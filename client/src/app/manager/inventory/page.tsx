"use client";
import React, { useState, useEffect } from "react";
import {
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TableContainer,
  Table,
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid2,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  TextField,
  MenuItem,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from "@mui/icons-material/Cancel"
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import Tooltip from "@mui/material/Tooltip";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import StarIcon from '@mui/icons-material/Star';

const CLOUDINARY_CLOUD_NAME = "dgegmjf04";

const Inventory: React.FC = () => {

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

    function createData(name: string, quantity: number, target_quantity: number) {
        let status: "low" | "medium" | "sufficient";
        if (quantity < target_quantity / 4) status = "low";
        else if (quantity < target_quantity / 2) status = "medium";
        else status = "sufficient";
        return { name, quantity, target_quantity, status };
    }

    type Item = {
        image_url: string;
        menu_item_id: number;
        price: number;
        name: string;
        type: string;
        amount_available: number;
        description: string | null;
        expiry_date: string | null;
        average_rating: number | null;
        ratings_count: number | null;
      };

    type InventoryItem = {
        inventory_item_id: number;
        name: string;
        quantity: number;
        target_quantity: number;
        expiration_date?: string;
    };
    
    type IngredientAmount = {
        inventory_item_id: number;
        amount: number;
    };

    
    
    const [errorMessage, setErrorMessage] = useState<string>('');

    const [menuItems, setMenuItems] = useState<Item[]>([]);
    const [error, setError] = useState('');

    const [itemDescription, setItemDescription] = useState('');
    const [menuItemExpiry, setMenuItemExpiry] = useState('');

    const uploadToCloudinary = async (file: File, itemType: string, itemName: string) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'panda_express_images'); // Replace with your preset name
          formData.append('public_id', `${itemType.toLowerCase()}${itemName.replace(/\s+/g, '_')}`);
      
          console.log('Starting upload with:', {
            file: file.name,
            type: itemType,
            name: itemName
          });
      
          const response = await fetch(
            'https://api.cloudinary.com/v1_1/dgegmjf04/upload',
            {
              method: 'POST',
              body: formData
            }
          );
      
          const responseText = await response.text();
          
          if (!response.ok) {
            console.error('Upload failed response:', responseText);
            throw new Error('Upload failed: ' + responseText);
          }
      
          const data = JSON.parse(responseText);
          console.log('Upload successful:', data);
          return data.secure_url;
        } catch (error) {
          console.error('Upload error:', error);
          throw error;
        }
      };

    useEffect(() => {
        console.log('Loaded menu items:', menuItems);
      }, [menuItems]);

    useEffect(() => {
        async function loadInventoryItems() {
            try {
                const response = await fetch('/api/inventory');
                if (!response.ok) throw new Error('Failed to fetch inventory items');
                const items = await response.json();
                setInventoryItems(items);
            } catch (err) {
                setError('Failed to load inventory items');
                console.error('Error loading inventory items:', err);
            }
        }
        loadInventoryItems();
    }, []);

    useEffect(() => {
        async function loadMenuItems() {
            try {
                const response = await fetch('/api/kiosk');
                if (!response.ok) throw new Error('Failed to fetch menu items');
                const items: Item[] = await response.json();
                const filteredItems = items.filter((item: Item) => item.type !== 'category');
                setMenuItems(filteredItems);
                
                if (filteredItems.length > 0) {
                    setSelectedItem(filteredItems[0].menu_item_id);
                    setNewPrice(filteredItems[0].price);
                }
            } catch (err) {
                setError('Failed to load menu items');
                console.error('Error loading menu items:', err);
            }
        }
        loadMenuItems();
    }, []);

    
      

    const [image, setImage] = useState<File | null>(null);
    const [expirationDate, setExpirationDate] = useState<string>('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemType, setNewItemType] = useState('');

    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<IngredientAmount[]>([]);
    const [newItemPrice, setNewItemPrice] = useState('');
    const [ingredientAmounts, setIngredientAmounts] = useState<{[key: number]: number}>({});

    // states for remove  item
    const [openDialog, setOpenDialog] = useState(false);
    const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [newPrice, setNewPrice] = useState<number>(0);

    // states for add menu item dialogue
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [loading, setLoading] = useState(false); // Handle loading state during image upload

    // handle dialog Open and Close
    const handleDialogOpen = () => {
        setOpenDialog(true);
        // Reset fields when opening dialog
        setSelectedItem(null);
        setNewItemName('');
        setNewItemPrice('');
        setNewItemType('');
        setItemDescription('');
        setMenuItemExpiry('');
      };
    const handleDialogClose = () => {
        resetMenuFields();
        setOpenDialog(false);
    };

    const handleMenuItemSelect = (e: SelectChangeEvent<number>) => {
        const selectedId = e.target.value as number;
        console.log('Selected ID:', selectedId);
        
        const item = menuItems.find(i => i.menu_item_id === selectedId);
        console.log('Found item:', item);
    
        if (item) {
          // Log each value before setting
          console.log('Setting:', {
            id: item.menu_item_id,
            name: item.name,
            price: item.price,
            type: item.type,
            description: item.description,
            expiry_date: item.expiry_date
          });
    
          setSelectedItem(item.menu_item_id);
          setNewItemName(item.name);
          setNewItemPrice(item.price.toString());
          setNewItemType(item.type);
          setItemDescription(item.description || '');
    
          if (item.expiry_date) {
            const dateOnly = item.expiry_date.split('T')[0];
            console.log('Setting expiry date:', dateOnly);
            setMenuItemExpiry(dateOnly);
          } else {
            setMenuItemExpiry('');
          }
        }
      };

    // handle remove dialog open and close
    const handleRemoveDialogOpen = () => setOpenRemoveDialog(true);
    const handleRemoveDialogClose = () => {
        resetMenuFields();
        setOpenRemoveDialog(false);
    }; 

    // open Add Item Dialog
    const handleAddDialogOpen = () => setOpenAddDialog(true);
    const handleAddDialogClose = () => {
        resetMenuFields();
        setOpenAddDialog(false);
    };  

    // add inventory dialog
    const [openAddInventoryDialog, setOpenAddInventoryDialog] = useState(false);
    const [newItemInventoryName, setNewItemInventoryName] = useState("");
    const [newQuantity, setNewQuantity] = useState(0);
    const [targetQuantity, setTargetQuantity] = useState(0);

    // remove inventory dialog
    const [openRemoveInventoryDialog, setOpenRemoveInventoryDialog] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<string>(""); // Store selected item

    // update inventory dialog
    const [openUpdateInventoryDialog, setOpenUpdateInventoryDialog] = useState(false);
    const [selectedInventoryForUpdate, setSelectedInventoryForUpdate] = useState<string>(""); // store selected item for update
    const [updatedQuantity, setUpdatedQuantity] = useState<number>(0); // store new quantity for update

    // HANDLERS/GETTERS =============================================================
    const handleAddInventoryDialogOpen = () => setOpenAddInventoryDialog(true);
    const handleAddInventoryDialogClose = () => {
        resetInventoryFields();
        setOpenAddInventoryDialog(false);
    };

    const handleRemoveInventoryDialogOpen = () => setOpenRemoveInventoryDialog(true);
    const handleRemoveInventoryDialogClose = () => {
        resetInventoryFields();
        setOpenRemoveInventoryDialog(false);
    };
    
    //handle update inventory

    const handleUpdateInventoryDialogOpen = () => setOpenUpdateInventoryDialog(true);
    const handleUpdateInventoryDialogClose = () => {
        resetInventoryFields();
        setOpenUpdateInventoryDialog(false);
    };

    // reset functions
    const resetInventoryFields = () => {
        setNewItemInventoryName('');
        setNewQuantity(0);
        setTargetQuantity(0);
        setExpirationDate('');
    };

    const resetMenuFields = () => {
        setNewItemName('');
        setNewItemPrice('');
        setNewItemType('');
        setSelectedIngredients([]);
        setIngredientAmounts({});
        setImage(null);
        setItemDescription('');
        setMenuItemExpiry('');
      };

    // handle the submit action
    const handleSubmit = async () => {
        const price = parseFloat(newItemPrice);
        if (!selectedItem || !newItemName || !newItemType || isNaN(price) || price <= 0) {
          alert("Please fill in all fields correctly.");
          return;
        }
      
        try {
          setLoading(true);
          let imageUrl = '';
          
          if (image) {
            // Upload to Cloudinary first
            imageUrl = await uploadToCloudinary(image, newItemType, newItemName);
          }
      
          const formData = new FormData();
          formData.append('menu_item_id', selectedItem.toString());
          formData.append('name', newItemName);
          formData.append('type', newItemType);
          formData.append('price', price.toString());
          formData.append('description', itemDescription);
          formData.append('expiry_date', menuItemExpiry);
          if (imageUrl) {
            formData.append('image_url', imageUrl);
          }
      
          const response = await fetch('/api/menu', {
            method: 'PUT',
            body: formData,
          });
      
          if (!response.ok) throw new Error('Failed to update menu item');
      
          // Refresh menu items
          const menuResponse = await fetch('/api/kiosk');
          if (!menuResponse.ok) throw new Error('Failed to refresh menu items');
          const updatedItems = await menuResponse.json();
          setMenuItems(updatedItems.filter((item: Item) => item.type !== 'category'));
      
          handleDialogClose();
        } catch (error) {
          console.error('Error updating menu item:', error);
          alert('Failed to update menu item. Please try again.');
        } finally {
          setLoading(false);
        }
      };

    // Handle the Submit Action for Add Item
    const handleAddItem = async () => {
        const price = parseFloat(newItemPrice);
        if (!newItemName || !newItemType || isNaN(price)) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        try {
            setLoading(true);
            let imageUrl = '';
            
            if (image) {
            // Upload to Cloudinary first
            imageUrl = await uploadToCloudinary(image, newItemType, newItemName);
            }

            const formData = new FormData();
            formData.append('name', newItemName);
            formData.append('type', newItemType);
            formData.append('price', price.toString());
            formData.append('description', itemDescription || '');
            formData.append('expiry_date', menuItemExpiry || '');
            formData.append('image_url', imageUrl); // Add the Cloudinary URL

            const response = await fetch('/api/menu', {
            method: 'POST',
            body: formData,
            });

            if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add menu item');
            }

            // Refresh menu items
            const refreshResponse = await fetch('/api/kiosk');
            if (!refreshResponse.ok) throw new Error('Failed to refresh menu items');
            const updatedItems = await refreshResponse.json();
            setMenuItems(updatedItems.filter((item: Item) => item.type !== 'category'));

            handleAddDialogClose();
        } catch (error: any) {
            console.error('Error adding menu item:', error);
            alert(error.message || 'Failed to add menu item. Please try again.');
        } finally {
            setLoading(false);
        }
        };
    

        const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
              // Validate file type
              if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
              }
              
              // Validate file size (e.g., max 5MB)
              if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
              }
          
              console.log('Selected file:', {
                name: file.name,
                type: file.type,
                size: file.size
              });
              
              setImage(file);
            }
          };

    const handleRemoveItem = async () => {
        if (!selectedItem) return;
    
        try {
            const response = await fetch('/api/menu', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    menu_item_id: selectedItem
                }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to delete menu item');
            }
    
            // Refresh menu items
            const refreshResponse = await fetch('/api/kiosk');
            const updatedMenuItems = await refreshResponse.json();
            setMenuItems(updatedMenuItems.filter((item: Item) => item.type !== 'category'));
    
            handleRemoveDialogClose();
        } catch {
            console.error('Error removing menu item');
        }
    };

    const getInventoryRows = () => {
        return inventoryItems.map(item => 
            createData(item.name, item.quantity, item.target_quantity)
        );
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
        case "low":
            return (
            <Tooltip title="Less than 25% inventory: Needs replenishment" arrow>
                <ErrorIcon color="error" />
            </Tooltip>
            );
        case "medium":
            return (
            <Tooltip title="Less than 50% inventory: Monitor levels" arrow>
                <RemoveCircleIcon color="warning" />
            </Tooltip>
            );
        case "sufficient":
            return (
            <Tooltip title="Sufficient inventory: No action needed" arrow>
                <CheckCircleIcon color="success" />
            </Tooltip>
            );
        default:
            return null;
        }
    };

    const handleUpdateInventory = async () => {
        if (!selectedInventoryForUpdate || updatedQuantity < 0 || targetQuantity < 0 || !expirationDate) {
            alert("Please fill in all fields correctly.");
            return;
        }
    
        try {
            const response = await fetch('/api/inventory', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: selectedInventoryForUpdate,
                    quantity: updatedQuantity,
                    target_quantity: targetQuantity,
                    expiration_date: expirationDate
                }),
            });
    
            if (!response.ok) throw new Error('Failed to update inventory');
    
            // Refresh inventory items
            const inventoryResponse = await fetch('/api/inventory');
            if (!inventoryResponse.ok) throw new Error('Failed to refresh inventory items');
            const updatedItems = await inventoryResponse.json();
            setInventoryItems(updatedItems);
    
            handleUpdateInventoryDialogClose();
        } catch (error) {
            console.error('Error updating inventory:', error);
            alert('Failed to update inventory. Please try again.');
        }
    };
    
    const handleRemoveInventoryItem = async () => {
        if (!selectedInventoryItem) {
            alert("Please select an item to remove.");
            return;
        }
    
        try {
            const response = await fetch('/api/inventory', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: selectedInventoryItem
                }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to remove inventory item');
            }
    
            // Refresh the menu items to show updated data
            const kioskResponse = await fetch('/api/kiosk');
            if (!kioskResponse.ok) {
                throw new Error('Failed to refresh menu items');
            }
            const updatedMenuItems = await kioskResponse.json();
            setMenuItems(updatedMenuItems.filter((item: Item) => item.type !== 'category'));
    
            handleRemoveInventoryDialogClose();
        } catch (error) {
            console.error('Error removing inventory item:', error);
            alert('Failed to remove inventory item. Please try again.');
        }
    };
    
    const handleAddInventoryItem = async () => {
        if (!newItemInventoryName || newQuantity <= 0 || targetQuantity <= 0 || !expirationDate) {
            alert("Please fill in all fields correctly.");
            return;
        }
    
        try {
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newItemInventoryName,
                    quantity: newQuantity,
                    target_quantity: targetQuantity,
                    expiration_date: expirationDate
                }),
            });
    
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to add inventory item');
            }
    
            // Refresh inventory items
            const inventoryResponse = await fetch('/api/inventory');
            if (!inventoryResponse.ok) {
                throw new Error('Failed to refresh inventory items');
            }
            const updatedItems = await inventoryResponse.json();
            setInventoryItems(updatedItems);
    
            resetInventoryFields();
            handleAddInventoryDialogClose();
        } catch (error: any) {
            console.error('Error adding inventory item:', error);
            alert(error.message || 'Failed to add inventory item. Please try again.');
        }
    };

    return (
    <Container
        style={{
            // backgroundColor: '#C0f0d2', // bg color for debug
            width: "98%",
        }}
        >

        {/* Update inventory item dialog */}
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
        <Dialog open={openUpdateInventoryDialog} onClose={handleUpdateInventoryDialogClose}>
            <DialogTitle>Update Inventory Item</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="normal">
                    <InputLabel>Select Item</InputLabel>
                    <Select
                        value={selectedInventoryForUpdate}
                        onChange={(e) => {
                            const item = inventoryItems.find(i => i.name === e.target.value);
                            if (item) {
                                setSelectedInventoryForUpdate(item.name);
                                setUpdatedQuantity(item.quantity);
                                setTargetQuantity(item.target_quantity);
                                setExpirationDate(item.expiration_date || '');
                            }
                        }}
                        label="Select Item"
                    >
                        {inventoryItems.map((item) => (
                            <MenuItem key={item.name} value={item.name}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label="New Quantity"
                    value={updatedQuantity}
                    onChange={(e) => setUpdatedQuantity(Number(e.target.value))}
                    margin="normal"
                    type="number"
                />

                <TextField
                    fullWidth
                    label="Target Quantity"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Number(e.target.value))}
                    margin="normal"
                    type="number"
                />

                <TextField
                    label="Expiration Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={expirationDate ? expirationDate.split('T')[0] : ''}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    fullWidth
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleUpdateInventoryDialogClose} startIcon={<CancelIcon />} color="error">
                    Cancel
                </Button>
                <Button onClick={handleUpdateInventory} startIcon={<CheckCircleIcon />} color="success">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog open={openRemoveInventoryDialog} onClose={handleRemoveInventoryDialogClose}>
            <DialogTitle>Remove Inventory Item</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Item</InputLabel>
                        <Select
                            value={selectedInventoryItem}
                            onChange={(e) => setSelectedInventoryItem(e.target.value as string)}
                            label="Select Item"
                        >
                            {getInventoryRows().map((row) => (
                                <MenuItem key={row.name} value={row.name}>
                                    {row.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRemoveInventoryDialogClose} startIcon={<CancelIcon />} color="error">Cancel</Button>
                    <Button onClick={handleRemoveInventoryItem} startIcon={<CheckCircleIcon />} color="success">Submit</Button>
                </DialogActions>
        </Dialog>


        {/* Add Item to Inventory Dialog */}
        <Dialog open={openAddInventoryDialog} onClose={handleAddInventoryDialogClose}>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Item Name"
                    value={newItemInventoryName}
                    onChange={(e) => setNewItemInventoryName(e.target.value)}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Current Quantity"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    margin="normal"
                    type="number"
                />
                <TextField
                    fullWidth
                    label="Target Quantity"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Number(e.target.value))}
                    margin="normal"
                    type="number"
                />
                <TextField
                    label="Expiration Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={expirationDate ? expirationDate.split('T')[0] : ''}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    fullWidth
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleAddInventoryDialogClose} startIcon={<CancelIcon />} color="error">
                    Cancel
                </Button>
                <Button onClick={handleAddInventoryItem} startIcon={<CheckCircleIcon />} color="success">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>

        {/* Add Item Dialog */}
        <Dialog open={openDialog} onClose={handleDialogClose}>
      <DialogTitle>Update Menu Item</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Select Item</InputLabel>
          <Select
            value={selectedItem || ''}
            onChange={handleMenuItemSelect}
            label="Select Item"
          >
            {menuItems.map((item) => (
              <MenuItem key={item.menu_item_id} value={item.menu_item_id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

                <TextField
                    fullWidth
                    margin="normal"
                    label="Item Name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                />

<TextField
          fullWidth
          margin="normal"
          label="Description"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          multiline
          rows={3}
        />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Item Type</InputLabel>
                    <Select
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                        label="Item Type"
                    >
                        <MenuItem value="entree">Entree</MenuItem>
                        <MenuItem value="premium entree">Premium Entree</MenuItem>
                        <MenuItem value="side">Side</MenuItem>
                        <MenuItem value="appetizer">Appetizer</MenuItem>
                        <MenuItem value="dessert">Dessert</MenuItem>
                        <MenuItem value="drink">Drink</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                fullWidth
                margin="normal"
                label="Price ($)"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                />

<TextField
          label="Expiry Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={menuItemExpiry}
          onChange={(e) => setMenuItemExpiry(e.target.value)}
          fullWidth
          margin="normal"
        />

                {/* Image Upload */}
                <Box marginTop={2}>
                    <Typography variant="subtitle1">Update Item Image</Typography>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDialogClose} startIcon={<CancelIcon />} color="error">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />} 
                    color="success"
                    disabled={loading}
                    >
                    {loading ? 'Uploading...' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>

        {/* Add Item Dialog */}
        <Dialog open={openAddDialog} onClose={handleAddDialogClose}>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Item Name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Description"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    multiline
                    rows={3}
                    />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Item Type</InputLabel>
                    <Select
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                        label="Item Type"
                    >
                        <MenuItem value="entree">Entree</MenuItem>
                        <MenuItem value="premium entree">Premium Entree</MenuItem>
                        <MenuItem value="side">Side</MenuItem>
                        <MenuItem value="appetizer">Appetizer</MenuItem>
                        <MenuItem value="dessert">Dessert</MenuItem>
                        <MenuItem value="drink">Drink</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                fullWidth
                margin="normal"
                label="Price ($)"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                />

                <TextField
                label="Expiry Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={menuItemExpiry}
                onChange={(e) => setMenuItemExpiry(e.target.value)}
                fullWidth
                margin="normal"
                />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Select Ingredients</InputLabel>
                    <Select
                        multiple
                        value={selectedIngredients.map(i => i.inventory_item_id)}
                        onChange={(event: SelectChangeEvent<number[]>) => {
                            const selectedIds = event.target.value as number[];
                            setSelectedIngredients(
                                selectedIds.map(id => ({
                                    inventory_item_id: id,
                                    amount: ingredientAmounts[id] || 0
                                }))
                            );
                        }}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip
                                        key={value}
                                        label={inventoryItems.find(item => item.inventory_item_id === value)?.name}
                                    />
                                ))}
                            </Box>
                        )}
                    >
                        {inventoryItems.map((item) => (
                            <MenuItem key={item.inventory_item_id} value={item.inventory_item_id}>
                                <Checkbox checked={selectedIngredients.some(i => i.inventory_item_id === item.inventory_item_id)} />
                                <ListItemText primary={item.name} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {selectedIngredients.map((ingredient) => (
                    <TextField
                        key={ingredient.inventory_item_id}
                        fullWidth
                        margin="normal"
                        label={`Amount needed for ${inventoryItems.find(item => item.inventory_item_id === ingredient.inventory_item_id)?.name}`}
                        value={ingredient.amount}
                        onChange={(e) => {
                            const newAmount = Number(e.target.value);
                            setSelectedIngredients(prev => 
                                prev.map(ing => 
                                    ing.inventory_item_id === ingredient.inventory_item_id
                                        ? { ...ing, amount: newAmount }
                                        : ing
                                )
                            );
                        }}
                        type="number"
                        inputProps={{ step: "0.01", min: "0" }}
                    />
                ))}

                {/* Image Upload */}
                <Box marginTop={2}>
                    <Typography variant="subtitle1">Upload Item Image</Typography>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={loading}
                    />
                    {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
                </Box>
                
            </DialogContent>
            <DialogActions>
                <Button onClick={handleAddDialogClose} startIcon={<CancelIcon />} color="error">
                    Cancel
                </Button>
                <Button onClick={handleAddItem} startIcon={<CheckCircleIcon />} color="success">
                    Add Item
                </Button>
            </DialogActions>
        </Dialog>

        {/* Remove Item Dialog */}
        <Dialog open={openRemoveDialog} onClose={handleRemoveDialogClose}>
                <DialogTitle>Remove Menu Item</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Item</InputLabel>
                        <Select
                            value={selectedItem}
                            onChange={(e) => setSelectedItem(e.target.value as number)} // filler code until db implemented
                            label="Select Item"
                        >
                            {menuItems.map((item) => (
                                <MenuItem key={item.menu_item_id} value={item.menu_item_id}>
                                    {item.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRemoveDialogClose} startIcon={<CancelIcon />} color="error">Cancel</Button>
                    <Button onClick={handleRemoveItem} startIcon={<CheckCircleIcon />} color="success">Submit</Button>
                </DialogActions>
        </Dialog>

        <Typography variant="h4" style={{ paddingBottom: "16px" }}>
            Inventory
        </Typography>

        <div
        style={{
            display: "flex",
            gap: "16px",
            paddingBottom: "16px",
            justifyContent: "left",
        }}
        >
            <Button variant="contained" color="success" onClick={handleAddInventoryDialogOpen} startIcon={<AddCircleIcon/>}> Add Item </Button>
            <Button variant="contained" color="error" onClick={handleRemoveInventoryDialogOpen} startIcon={<RemoveCircleIcon />}> Remove Item </Button>
            <div style={{ marginLeft: "auto" }}>
                <Button variant="contained" color="primary" onClick={handleUpdateInventoryDialogOpen}>Update Quantity</Button>
            </div>
        </div>
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="inventory table">
                <TableHead>
                    <TableRow>
                        <TableCell align="left">Name</TableCell>
                        <TableCell align="left">Quantity</TableCell>
                        <TableCell align="left">Target Quantity</TableCell>
                        <TableCell align="center">Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {getInventoryRows().map((row, index) => (
                        <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                            <TableCell component="th" scope="row">
                                {row.name}
                            </TableCell>
                            <TableCell align="left">{row.quantity}</TableCell>
                            <TableCell align="left">{row.target_quantity}</TableCell>
                            <TableCell align="center">{getStatusIcon(row.status)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        {/* Menu Items */}
        <Typography variant="h4" style={{ paddingTop: "16px", paddingBottom: "16px" }}>
            Menu Items
        </Typography>
        <div
            style={{
            display: "flex",
            gap: "16px",
            paddingBottom: "16px",
            justifyContent: "left",
            }}
        >
            <Button variant="contained" color="success" onClick={handleAddDialogOpen} startIcon={<AddCircleIcon/>}> Add Item </Button>
            <Button variant="contained" color="error" onClick={handleRemoveDialogOpen} startIcon={<RemoveCircleIcon />}>
                Remove Item
            </Button> 
            <div style={{ marginLeft: "auto" }}>
                <Button variant="contained" color="primary" onClick={handleDialogOpen}>
                    Update Item
                </Button>            
            </div>
        </div>
        <Grid2 container spacing={2} justifyContent="left">
  {menuItems.map((item) => (
    <Grid2 key={item.menu_item_id}>
      <Card
        sx={{
          height: '325px',
          maxWidth: 275,
          transition: "background-color 0.3s ease",
          "&:hover": { backgroundColor: "#f0f0f0" },
        }}
      >
        <CardMedia
        component="img"
        height="140"
        src={getCloudinaryUrl(item.name, item.type)}
        alt={item.name}
        />
        <CardContent>
            <Box display="flex" flexDirection="column" justifyContent="space-between" >
                <div>
                <Typography variant="h6" component="div">
                    {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    ${item.price.toFixed(2)}
                </Typography>
                </div>
                {item.average_rating !== null && item.average_rating !== undefined ? (
                <>
                    <Box display="flex" alignItems="center" sx={{mt: 1, mb: 1}}>
                    {[...Array(Math.round(item.average_rating))].map((_, index) => (
                        <StarIcon key={index} color="error" />
                    ))}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {item.average_rating.toFixed(1)} / 5
                    </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                    Based on {item.ratings_count} {item.ratings_count === 1 ? 'rating' : 'ratings'}
                    </Typography>
                </>
                ) : (
                <Typography variant="body2" color="text.secondary">
                    No ratings yet
                </Typography>
                )}
            </Box>
        </CardContent>
      </Card>
    </Grid2>
  ))}
</Grid2>

    </Container>
  );
};

export default Inventory;