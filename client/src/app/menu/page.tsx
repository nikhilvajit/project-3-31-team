"use client";
import React, { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, Box, CardMedia } from '@mui/material';
import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = "dgegmjf04";

interface MenuItemResponse {
  menu_item_id: number;
  name: string;
  price: number;
  amount_available: number;
  type: string;
  description: string;
}

interface MenuItem extends MenuItemResponse {
  category?: string;
  image?: string;
  calories?: string;
  isFavorite?: boolean;
  prices?: { size: string; price: string; }[];
}

interface DrinkItem extends MenuItemResponse {
  size?: string;
}

interface LocationState {
  city: string;
  state: string;
  lat: number;
  lon: number;
}

interface NominatimResponse {
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
  lat: string;
  lon: string;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
  };
}

const Menu_Board = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getWeatherDescription = (code: number): string => {
    // OpenMeteo weather codes
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm',
    };
    return weatherCodes[code] || 'Unknown';
  };

  const [location, setLocation] = useState<LocationState | null>(null);

  const mealOptions = [
    {
      title: 'BOWL',
      description: '1 entrée & 1 side',
      price: '$6.00',
      calories: '190-990 cal',
      icon: 'images/bowl-icon.png' 
    },
    {
      title: 'PLATE',
      description: '2 entrées & 1 side',
      price: '$7.00',
      calories: '240-1440 cal',
      icon: 'images/plate-icon.png' 
    },
    {
      title: 'BIGGER PLATE',
      description: '3 entrées & 1 side',
      price: '$8.50',
      calories: '320-1930 cal',
      icon: 'images/bigger-plate-icon.png' 
    },
    {
      title: 'A LA CARTE',
      description: '1 side',
      price: '$4.10',
      calories: '250-1000 cal',
      icon: 'images/a-la-carte-icon.png' 
    },
    {
      title: 'EXTRAS',
      description: 'Drinks and appetizers',
      price: 'Price Varies',
      calories: '',
      icon: 'images/extras-icon.png' 
    }
  ];
  
  interface WeatherApiResponse {
    current: {
      temperature: number;
      weather_descriptions: string[];
      weather_icons: string[];
    };
  }
  
  interface WeatherState {
    temperature: string;
    condition: string;
    icon: string | null;
  }

  const [weather, setWeather] = useState<WeatherState>({
    temperature: '--',
    condition: 'Loading...',
    icon: null,
  });

  const mapDatabaseCategoryToFrontend = (dbCategory: string): string => {
    // Convert to lowercase for consistent comparison
    const category = dbCategory.toLowerCase();
    
    // Map multiple backend categories to "Extra"
    if (category === 'appetizer' || category === 'dessert' || category === 'drink') {
      return 'Extra';
    }
    // Handle other category mappings
    else if (category === 'entree' || category === 'premium entree') {
      return 'Entree';
    }
    else if (category === 'side') {
      return 'Side';
    }
    return category; // fallback
  };
  
  const getCloudinaryUrl = (itemName: string, itemType: string) => {
    // Handle drinks specially
    if (itemType.toLowerCase() === 'drink') {
      const size = itemName.split(' ')[0].toLowerCase();
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/drink${size}_Drink`;
    }
  
    // Determine the type prefix based on item type
    const typePrefix = 
      itemType.toLowerCase() === 'premium entree' ? 'premium_entree' :
      itemType.toLowerCase() === 'side' ? 'side' :
      itemType.toLowerCase() === 'appetizer' ? 'appetizer' :
      itemType.toLowerCase() === 'dessert' ? 'dessert' :  // Added dessert handling
      'entree';
    
    // Format the item name: remove special characters, capitalize words, join with underscores
    const formattedName = itemName
      .replace(/[^a-zA-Z0-9 ]/g, '')  // Remove special characters
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Capitalize first letter of each word
      .join('_');
  
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/${typePrefix}${formattedName}`;
  };
  
  // Update the fetchMenuItems function to use this mapping
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get<MenuItemResponse[]>('/api/menu2');
        
        // Separate drinks from other items
        const drinks = response.data.filter((item: MenuItemResponse) => 
          item.type.toLowerCase() === 'drink'
        );
        
        // Create consolidated drink item
        const drinkItem: MenuItem | null = drinks.length > 0 ? {
          menu_item_id: drinks[0].menu_item_id,
          name: 'Drink',
          type: 'drink',
          category: 'Extra',
          image: getCloudinaryUrl('Medium', 'drink'),  // Default to medium drink image
          amount_available: drinks[0].amount_available,
          price: drinks[0].price,
          description: drinks[0].description,
          prices: drinks.map((drink: DrinkItem) => ({
            size: drink.name.split(' ')[0],
            price: drink.price.toFixed(2)
          })).sort((a, b) => {
            const sizeOrder: { [key: string]: number } = { 'Small': 1, 'Medium': 2, 'Large': 3 };
            return sizeOrder[a.size] - sizeOrder[b.size];
          }),
          isFavorite: false
        } : null;

        // Format all non-drink items
        const otherItems = response.data
          .filter((item: MenuItemResponse) => item.type.toLowerCase() !== 'drink')
          .map((item: MenuItemResponse) => ({
            ...item,
            category: mapDatabaseCategoryToFrontend(item.type),
            image: getCloudinaryUrl(item.name, item.type),
            price: parseFloat(item.price.toFixed(2)),
            calories: '200 cal',
            isFavorite: false,
          }));

        const formattedMenuItems = drinkItem
          ? [...otherItems, drinkItem]
          : otherItems;

        setMenuItems(formattedMenuItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('Failed to fetch menu items');
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  useEffect(() => {
    const getUserLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Get city name from coordinates using reverse geocoding
              const { data } = await axios.get<NominatimResponse>(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
              );
              
              if (data && data.address) {
                setLocation({
                  city: data.address.city || data.address.town || data.address.village || 'Unknown',
                  state: data.address.state || 'Unknown',
                  lat: position.coords.latitude,
                  lon: position.coords.longitude
                });
              }
            } catch (error) {
              console.error('Error getting city name:', error);
              setLocation(null);
            }
          },
          (error) => {
            console.error('Error getting user location:', error);
            setLocation(null);
          }
        );
      }
    };
  
    getUserLocation();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!location) return;
      
      try {
        const { data } = await axios.get<OpenMeteoResponse>(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code`
        );
  
        if (data && data.current) {
          const temp = Math.round(data.current.temperature_2m * 9/5 + 32); // Convert to Fahrenheit
          const condition = getWeatherDescription(data.current.weather_code);
          
          setWeather({
            temperature: temp.toString(),
            condition: condition,
            icon: null
          });
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeather({ temperature: '--', condition: 'Error', icon: null });
      }
    };
  
    fetchWeather();
  }, [location]);

  

  const SimpleWeatherBox = () => {
    return (
      <Card
        sx={{
          mb: 2,
          bgcolor: '#C02827',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography sx={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 400 }}> Panda Express </Typography>
          {location && (  // Only show weather if location is available
            <Box
              sx={{
                display: 'flex',
                gap: 4,
                alignItems: 'center',
              }}
            >
              {weather.icon && (
                <img
                  src={weather.icon}
                  alt="Weather Icon"
                  style={{ width: 40, height: 40 }}
                />
              )}
              <Box>
                <Typography
                  sx={{
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {weather.temperature}°F
                </Typography>
                <Typography sx={{ color: '#ffffff' }}>{weather.condition}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    );
  };

  // Group items by category
  type MenuItem = {
    menu_item_id: number;
    name: string;
    price: number; // Changed from string since your DB uses double precision
    amount_available: number;
    type: string;
    description: string;
    // Frontend display properties
    image?: string;
    category?: string;
    calories?: string;
    isFavorite?: boolean;
    prices?: { size: string; price: string; }[];
  };

  const groupedItems = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const category = item.category || item.type; // Fallback to type if category is not set
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const categoryConfig = [
    { key: 'Entree', display: 'ENTRÉES' },
    { key: 'Side', display: 'SIDES' },
    { key: 'Extra', display: 'EXTRAS' }
  ];

  type MenuItemProps = {
    item: MenuItem; // Specify that the 'item' prop should be of type 'MenuItem'
  };

  const MenuItemCard: React.FC<MenuItemProps> = ({ item }) => {
    return (
      <Grid item>
        <Card
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            height: '110px',
            width: '100%',
            maxWidth: '475px',
            position: 'relative',
          }}
        >
          {/* Customer Favorite Badge */}
          {item.isFavorite && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: '#8b5e34',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              Customer Favorite
            </Box>
          )}

          <Box
            sx={{
              width: '120px',
              height: '120px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 1,
            }}
          >
            <CardMedia
              component="img"
              image={item.image}
              alt={item.name}
              sx={{
                maxHeight: '100px',
                maxWidth: '100px',
                objectFit: 'contain',
              }}
            />
          </Box>
  
          <CardContent
            sx={{
              flex: 1,
              p: 1,
              '&:last-child': { pb: 1 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: 'calc(100% - 120px)',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#2c2c2c',
                mb: 0.25,
              }}
            >
              {item.name}
            </Typography>
            {item.description && (
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontStyle: 'italic',
                  color: '#666',
                  mb: 0.25,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                {item.description}
              </Typography>
            )}
            {item.prices ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {item.prices.map((sizePrice, index) => (
                  <Typography
                    key={index}
                    sx={{
                      fontSize: '0.75rem',
                      color: '#666',
                      mx: 0.5,
                    }}
                  >
                    {sizePrice.size}: ${sizePrice.price}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                ${item.price.toFixed(2)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };
  


  return (
    <Box 
      sx={{ 
        width: '100vw',
        height: '100vh',
        bgcolor: '#faf6f1',
        overflow: 'hidden',
        p: 2
      }}
    >
      {/* Weather Box */}
      <SimpleWeatherBox />      
      <Card
        sx={{
          mb: 2,
          bgcolor: '#rgb(37, 150, 190)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
      <Grid container sx={{ p: 1.5 }}>
        {mealOptions.map((option, index) => (
          <Grid item xs={2.4} key={index}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1,
              }}
            >
              {/* Display only the icon */}
              <img
                src={option.icon}
                alt={option.title}
                style={{
                  width: '40px',
                  height: '40px',
                  marginRight: '8px', // Add some spacing between icon and text
                }}
              />

              {/* Text content */}
              <Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: '#2c2c2c',
                    mb: 0.25,
                  }}
                >
                  {option.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    color: '#666',
                    mb: 0.25,
                  }}
                >
                  {option.description} - {option.price}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    color: '#666',
                  }}
                >
                  {option.calories}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
      </Card>


      {/* Menu Categories */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3,
        height: 'calc(100vh - 140px)',
      }}>
        {categoryConfig.map(({ key, display }) => groupedItems[key] && (
          <Box
          key={key}
          sx={{
            flex: key === 'Side' || key === 'Extra' ? 0.4 : 1, // Reduce the size for 'Side' and 'Extra'
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              pb: 0.5,
              borderBottom: '2px solid #8b5e34',
              color: '#2c2c2c',
              fontSize: '1rem',
            }}
          >
            {display}
          </Typography>
          <Grid
            container
            direction="column"
            spacing={1}
            sx={{
              flex: 1,
              overflowY: 'hidden',
            }}
          >
            {groupedItems[key].map((item, index) => (
              <MenuItemCard key={index} item={item} />
            ))}
          </Grid>
        </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Menu_Board;