import { useState, useEffect, type ReactNode } from 'react';
import Navbar from './nav';
import { fetchMedicines, fetchOrders, placeMedicineOrder, cancelMedicineOrder } from './services/flaskService';
import { useAuth } from './contexts/AuthContext';
import { Apple, Brain, Flower, Heart, Pill, Syringe } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  price: number;
  stock: number;
  manufacturer: string;
  prescriptionRequired: boolean;
  description: string;
  sideEffects: string[];
  activeIngredients: string[];
  image: ReactNode;
}

interface Order {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'ready' | 'delivered' | 'cancelled' | 'confirmed';
  orderDate: string;
  pharmacyName: string;
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
}

const Pharmacy = () => {
  const { principal, isAuthenticated, isLoading: authLoading } = useAuth();

  // Define getCategoryIcon before using it in state initialization
  const getCategoryIcon = (category: string): ReactNode => {
    const iconMap: Record<string, ReactNode> = {
      "pain relief": <Pill className="w-8 h-8 text-emerald-600" />,
      "pain-relief": <Pill className="w-8 h-8 text-emerald-600" />,
      "antibiotic": <Syringe className="w-8 h-8 text-blue-600" />,
      "antibiotics": <Syringe className="w-8 h-8 text-blue-600" />,
      "vitamin": <Apple className="w-8 h-8 text-orange-500" />,
      "vitamins": <Apple className="w-8 h-8 text-orange-500" />,
      "allergy": <Flower className="w-8 h-8 text-pink-500" />,
      "diabetes": <Syringe className="w-8 h-8 text-red-500" />,
      "heart": <Heart className="w-8 h-8 text-red-600" />,
      "mental-health": <Brain className="w-8 h-8 text-purple-600" />,
      "digestive health": <Apple className="w-8 h-8 text-gray-500" />,
      "digestive": <Apple className="w-8 h-8 text-gray-500" />,
    };

    return iconMap[category.toLowerCase()] ?? (
      <Pill className="w-4 h-4 text-gray-500" />
    );
  };

  const getCategoryProfile = (category: string) => {
    const colors: Record<string, string> = {
      "pain relief": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "pain-relief": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "antibiotic": "bg-blue-100 text-blue-700 border-blue-200",
      "antibiotics": "bg-blue-100 text-blue-700 border-blue-200",
      "vitamin": "bg-orange-100 text-orange-700 border-orange-200",
      "vitamins": "bg-orange-100 text-orange-700 border-orange-200",
      "allergy": "bg-pink-100 text-pink-700 border-pink-200",
      "diabetes": "bg-red-100 text-red-700 border-red-200",
      "heart": "bg-red-100 text-red-700 border-red-200",
      "mental-health": "bg-purple-100 text-purple-700 border-purple-200",
      "digestive health": "bg-green-100 text-green-700 border-green-200",
      "digestive": "bg-green-100 text-green-700 border-green-200",
    };

    return colors[category.toLowerCase()] || "bg-stone-100 text-stone-700 border-stone-200";
  };

  // Show loading or redirect if not authenticated
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !principal) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Please log in to access pharmacy</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('pharmacy_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Restore image property for each medicine
          return parsed.map((item: CartItem) => ({
            ...item,
            medicine: {
              ...item.medicine,
              image: getCategoryIcon(item.medicine.category)
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    return [];
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());

  const categories = [
    'all', 'pain relief', 'antibiotic', 'vitamin', 'allergy', 
    'diabetes', 'heart', 'mental-health', 'digestive health'
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch real medicines and orders data from ICP backend
        const medicinesData = await fetchMedicines();
        const ordersData = await fetchOrders(principal!);
        
        // Parse ICP medicine data format using numeric keys
        const parsedMedicines = medicinesData.map((medicine: any) => ({
          id: medicine["1_098_344_064"] || medicine.medicine_id || `med_${Date.now()}_${Math.random()}`,
          name: medicine["1_224_700_491"] || medicine.name || 'Unknown Medicine',
          genericName: medicine["1_026_369_715"] || medicine.generic_name || medicine["1_224_700_491"] || medicine.name || 'N/A',
          category: (medicine["2_909_547_262"] || medicine.category || 'general').toLowerCase().replace(/\s+/g, '-'),
          dosage: medicine["829_945_655"] || medicine.dosage || 'N/A',
          price: medicine["3_364_572_809"] || medicine.price || 0,
          stock: medicine["2_216_036_054"] || medicine.stock || 0,
          manufacturer: medicine["341_121_617"] || medicine.manufacturer || 'Unknown',
          prescriptionRequired: medicine["3_699_773_643"] || medicine.requires_prescription || false,
          description: medicine["1_595_738_364"] || medicine.description || 'Medicine description not available.',
          sideEffects: ['Consult doctor for side effects'], // Default since not in response
          activeIngredients: medicine["819_652_970"] ? [medicine["819_652_970"]] : (medicine.active_ingredient ? [medicine.active_ingredient] : ['N/A']),
          image: getCategoryIcon((medicine["2_909_547_262"] || medicine.category || 'general').toLowerCase())
        }));
        
        // Parse ICP orders data format
        const parsedOrders = ordersData.map((order: any) => {
          // Convert ICP nanosecond timestamp to proper date
          let formattedDate = new Date().toISOString().split('T')[0]; // fallback
          if (order.order_date || order.orderDate) {
            const timestamp = order.order_date || order.orderDate;
            if (typeof timestamp === 'string' && timestamp.length > 10) {
              // Convert nanoseconds to milliseconds
              const milliseconds = parseInt(timestamp) / 1_000_000;
              formattedDate = new Date(milliseconds).toISOString().split('T')[0];
            } else {
              // Already in proper format
              formattedDate = timestamp;
            }
          }
          
          return {
            id: order.order_id || order.id || `ord_${Date.now()}`,
            medicineId: order.medicine_id || order.medicineId,
            medicineName: order.medicine_name || order.medicineName || 'Unknown Medicine',
            quantity: order.quantity || order.qty || 1,
            totalPrice: order.total_price || order.totalPrice || order.price || 0,
            status: order.status || 'pending',
            orderDate: formattedDate,
            pharmacyName: order.pharmacy_name || order.pharmacyName || 'HealthPlus Pharmacy'
          };
        });
        
        setMedicines(parsedMedicines.length > 0 ? parsedMedicines : getDefaultMedicines());
        setOrders(parsedOrders);
        
      } catch (error) {
        console.error('Error loading pharmacy data from backend:', error);
        // Fallback to default data if backend is unavailable
        setMedicines(getDefaultMedicines());
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [principal]);

  const getDefaultMedicines = (): Medicine[] => [
    {
      id: '1',
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      category: 'pain-relief',
      dosage: '500mg',
      price: 5.99,
      stock: 150,
      manufacturer: 'HealthPlus',
      prescriptionRequired: false,
      description: 'Effective pain reliever and fever reducer for mild to moderate pain.',
      sideEffects: ['Nausea', 'Stomach upset', 'Allergic reactions (rare)'],
      activeIngredients: ['Acetaminophen 500mg'],
      image: <Pill className="w-8 h-8 text-emerald-600" />
    },
    {
      id: '2',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin Trihydrate',
      category: 'antibiotics',
      dosage: '250mg',
      price: 12.50,
      stock: 80,
      manufacturer: 'MediCore',
      prescriptionRequired: true,
      description: 'Penicillin-based antibiotic for bacterial infections.',
      sideEffects: ['Diarrhea', 'Nausea', 'Skin rash', 'Vomiting'],
      activeIngredients: ['Amoxicillin Trihydrate 250mg'],
      image: <Syringe className="w-8 h-8 text-blue-600" />
    }
  ];

  const filteredMedicines = medicines.filter(medicine => {
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && medicine.stock > 0;
  });

  const addToCart = (medicine: Medicine, quantity: number = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.medicine.id === medicine.id);
      let updated;
      if (existingItem) {
        updated = prev.map(item =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...prev, { medicine, quantity }];
      }
      // Save to localStorage (exclude image property to avoid circular reference)
      try {
        const cartForStorage = updated.map(item => ({
          ...item,
          medicine: {
            ...item.medicine,
            image: undefined // Remove image property before saving
          }
        }));
        localStorage.setItem('pharmacy_cart', JSON.stringify(cartForStorage));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
      return updated;
    });
  };

  const updateCartQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => {
        const updated = prev.filter(item => item.medicine.id !== medicineId);
        try {
          const cartForStorage = updated.map(item => ({
            ...item,
            medicine: {
              ...item.medicine,
              image: undefined // Remove image property before saving
            }
          }));
          localStorage.setItem('pharmacy_cart', JSON.stringify(cartForStorage));
        } catch (error) {
          console.error('Error saving cart to localStorage:', error);
        }
        return updated;
      });
    } else {
      setCart(prev => {
        const updated = prev.map(item =>
          item.medicine.id === medicineId
            ? { ...item, quantity }
            : item
        );
        try {
          const cartForStorage = updated.map(item => ({
            ...item,
            medicine: {
              ...item.medicine,
              image: undefined // Remove image property before saving
            }
          }));
          localStorage.setItem('pharmacy_cart', JSON.stringify(cartForStorage));
        } catch (error) {
          console.error('Error saving cart to localStorage:', error);
        }
        return updated;
      });
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.medicine.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    setIsOrdering(true);
    
    try {
      // Place each order with the ICP backend
      const orderPromises = cart.map(item => 
        placeMedicineOrder(item.medicine.id, item.quantity, principal!)
      );
      
      const orderResults = await Promise.all(orderPromises);
      console.log('Order results:', orderResults);
      
      // Check if all orders were successful
      const successfulOrders = orderResults.filter(result => result.success);
      
      if (successfulOrders.length > 0) {
        // Create local order objects for immediate UI update
        const newOrders: Order[] = cart.map((item, index) => {
          const orderResult = orderResults[index];
          return {
            id: orderResult.order_id || `ord_${Date.now()}_${index}`,
            medicineId: item.medicine.id,
            medicineName: `${item.medicine.name} ${item.medicine.dosage}`,
            quantity: item.quantity,
            totalPrice: item.medicine.price * item.quantity,
            status: 'pending',
            orderDate: new Date().toISOString().split('T')[0],
            pharmacyName: 'HealthPlus Pharmacy'
          };
        });

        setOrders(prev => [...prev, ...newOrders]);
        setCart([]);
        setShowCart(false);
        // Clear cart from localStorage
        try {
          localStorage.removeItem('pharmacy_cart');
        } catch (error) {
          console.error('Error clearing cart from localStorage:', error);
        }
        // Show success message
        alert(`Successfully placed ${successfulOrders.length} order(s) on the blockchain!`);
      } else {
        alert('Failed to place orders. Please try again.');
      }
      
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Error placing orders. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrders(prev => new Set(prev).add(orderId));
    
    try {
      const result = await cancelMedicineOrder(orderId, principal!);
      
      if (result.success) {
        // Remove the cancelled order from the list
        setOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Show success message
        alert(`Order cancelled successfully!\n\nID: ${orderId}\nStatus: ${result.message}`);
      } else {
        // Show error message
        alert(`Failed to cancel order:\n${result.message}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error cancelling order. Please try again.');
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const formatCategory = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleMedicineClick = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowMedicineModal(true);
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-stone-200">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-stone-800 tracking-wide font-serif">
                Pharmacy
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowOrders(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <span>My Orders ({orders.length})</span>
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                <span>Cart ({cart.length})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search medicines by name, generic name, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-200 font-light text-lg placeholder:opacity-30"
                />
              </div>
              {/* Custom dropdown wrapper */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none w-full md:w-auto bg-white px-6 py-4 pr-12 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-200 font-light text-lg"
                >
                  <option value="all">All Categories</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>
                      {formatCategory(category)}
                    </option>
                  ))}
                </select>
                {/* Custom Arrow Icon */}
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-4 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-stone-500 font-light">Loading medicines...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Medicine Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedicines.map((medicine) => (
              <div key={medicine.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full">
                <div className="p-6 flex-1" onClick={() => handleMedicineClick(medicine)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border ${getCategoryProfile(medicine.category)}`}> 
                        {medicine.image}
                      </div>
                      <div>
                        <h3 className="font-medium text-stone-800 mb-1">{medicine.name}</h3>
                        <p className="text-sm text-stone-500 font-light">{medicine.genericName}</p>
                      </div>
                    </div>
                    {medicine.prescriptionRequired && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        Rx
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getCategoryProfile(medicine.category)}`}> 
                      {formatCategory(medicine.category)}
                    </span>
                  </div>

                  <p className="text-stone-600 font-light mb-4 leading-relaxed text-sm">
                    {medicine.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-stone-500 font-light mb-1">Dosage</p>
                      <p className="text-stone-700 text-sm">{medicine.dosage}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 font-light mb-1">Stock</p>
                      <p className="text-stone-700 text-sm">{medicine.stock} units</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-stone-500 font-light mb-1">Manufacturer</p>
                    <p className="text-stone-700 text-sm">{medicine.manufacturer}</p>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-100 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-medium text-stone-800">
                      ${medicine.price.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(medicine);
                      }}
                      disabled={medicine.prescriptionRequired}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:bg-stone-300 disabled:cursor-not-allowed text-sm"
                    >
                      {medicine.prescriptionRequired ? 'Prescription Required' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-stone-200/60">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-stone-800 font-serif">
                  Shopping Cart
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-stone-500 font-light">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.medicine.id} className="flex items-center space-x-4 p-4 border border-stone-200 rounded-lg">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border ${getCategoryProfile(item.medicine.category)}`}>
                          {item.medicine.image}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium text-stone-800">{item.medicine.name}</h3>
                          <p className="text-sm text-stone-500 font-light">{item.medicine.dosage}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.medicine.id, item.quantity - 1)}
                            className="w-8 h-8 bg-stone-200 text-stone-600 rounded-full flex items-center justify-center hover:bg-stone-300"
                          >
                            −
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.medicine.id, item.quantity + 1)}
                            className="w-8 h-8 bg-stone-200 text-stone-600 rounded-full flex items-center justify-center hover:bg-stone-300"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-stone-800">
                            ${(item.medicine.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-stone-200 pt-6">
                    <div className="flex items-center justify-between text-xl font-medium text-stone-800 mb-6">
                      <span>Total: ${getTotalPrice().toFixed(2)}</span>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowCart(false)}
                        className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-lg font-medium hover:bg-stone-50 transition-colors duration-200"
                      >
                        Continue Shopping
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={isOrdering}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isOrdering ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </span>
                        ) : (
                          'Place Order'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Medicine Detail Modal */}
      {showMedicineModal && selectedMedicine && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-stone-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 ${getCategoryProfile(selectedMedicine.category)} shadow-sm`}>
                    {selectedMedicine.image}
                  </div>
                  <div>
                    <h2 className="text-2xl font-light text-stone-800 font-serif">
                      {selectedMedicine.name}
                    </h2>
                    <p className="text-stone-500 font-light">{selectedMedicine.genericName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMedicineModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl transition-colors duration-200"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500 font-light mb-1">Category</p>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getCategoryProfile(selectedMedicine.category)}`}>
                    {formatCategory(selectedMedicine.category)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-stone-500 font-light mb-1">Price</p>
                  <p className="text-xl font-medium text-stone-800">${selectedMedicine.price.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">Description</h3>
                <p className="text-stone-600 font-light leading-relaxed">{selectedMedicine.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">Active Ingredients</h3>
                <ul className="text-stone-600 font-light">
                  {selectedMedicine.activeIngredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">Side Effects</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <ul className="text-orange-800 font-light space-y-1">
                    {selectedMedicine.sideEffects.map((effect, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        {effect}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500 font-light mb-1">Manufacturer</p>
                  <p className="text-stone-700">{selectedMedicine.manufacturer}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 font-light mb-1">Stock Available</p>
                  <p className="text-stone-700">{selectedMedicine.stock} units</p>
                </div>
              </div>

              {/* Prescription Info */}
              {selectedMedicine.prescriptionRequired && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs font-medium">Rx Required</span>
                    <p className="text-orange-800 font-light text-sm">
                      This medicine requires a prescription. Please consult with a doctor first.
                    </p>
                  </div>
                </div>
              )}

              {/* Dosage and Usage */}
              <div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">Dosage & Usage</h3>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                  <p className="text-stone-700 font-medium">{selectedMedicine.dosage}</p>
                  <p className="text-stone-600 font-light text-sm mt-1">
                    Follow your healthcare provider's instructions for proper usage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrders && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-stone-200/60">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-stone-800 font-serif">
                  My Orders
                </h2>
                <button
                  onClick={() => setShowOrders(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl transition-colors duration-200"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-stone-500 font-light text-lg">No orders yet</p>
                  <p className="text-stone-400 font-light">Your order history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-stone-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-stone-800">{order.medicineName}</h3>
                          <p className="text-stone-500 font-light">Order ID: {order.id}</p>
                          <p className="text-stone-500 font-light">Pharmacy: {order.pharmacyName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-light text-stone-800">${order.totalPrice}</p>
                          <p className="text-stone-500 font-light">Qty: {order.quantity}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-stone-100 text-stone-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <p className="text-stone-500 font-light">Ordered: {order.orderDate}</p>
                        </div>
                        
                        {order.status === 'pending' || order.status === 'processing' ? (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrders.has(order.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingOrders.has(order.id) ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;