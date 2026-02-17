
import React, { useState, useMemo } from 'react';
import { MENU_ITEMS } from './constants';
import { MenuItem, CartItem } from './types';
import MenuCard from './components/MenuCard';
import LiveBarista from './components/LiveBarista';
import { getBaristaRecommendation, visualizeCustomDrink, findNearbyShops } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'menu' | 'ai' | 'custom' | 'locations'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // AI Barista State
  const [baristaInput, setBaristaInput] = useState('');
  const [baristaResponse, setBaristaResponse] = useState('');
  const [isLoadingBarista, setIsLoadingBarista] = useState(false);

  // Custom Drink State
  const [customPrompt, setCustomPrompt] = useState('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Locations State
  const [searchLoc, setSearchLoc] = useState('');
  const [locationResults, setLocationResults] = useState<{text: string, grounding: any} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleBaristaChat = async () => {
    if (!baristaInput.trim()) return;
    setIsLoadingBarista(true);
    setBaristaResponse('');
    try {
      const res = await getBaristaRecommendation(baristaInput);
      setBaristaResponse(res || 'I am sorry, I couldn\'t find a recommendation for that.');
    } catch (e) {
      setBaristaResponse('Connection to the brew center lost. Try again later.');
    } finally {
      setIsLoadingBarista(false);
    }
  };

  const handleGenerateDrink = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    setCustomImage(null);
    try {
      const img = await visualizeCustomDrink(customPrompt);
      setCustomImage(img);
    } catch (e) {
      alert("Failed to brew your visual masterpiece.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFindShops = async () => {
    setIsLocating(true);
    try {
      const res = await findNearbyShops(searchLoc || "Los Angeles");
      setLocationResults(res);
    } catch (e) {
      alert("Lost our way to the cafe.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-mug-hot text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Aura Brew</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab('menu')} className={`text-sm font-semibold transition-colors ${activeTab === 'menu' ? 'text-amber-600' : 'text-stone-500 hover:text-stone-900'}`}>Menu</button>
            <button onClick={() => setActiveTab('ai')} className={`text-sm font-semibold transition-colors ${activeTab === 'ai' ? 'text-amber-600' : 'text-stone-500 hover:text-stone-900'}`}>AI Barista</button>
            <button onClick={() => setActiveTab('custom')} className={`text-sm font-semibold transition-colors ${activeTab === 'custom' ? 'text-amber-600' : 'text-stone-500 hover:text-stone-900'}`}>Custom</button>
            <button onClick={() => setActiveTab('locations')} className={`text-sm font-semibold transition-colors ${activeTab === 'locations' ? 'text-amber-600' : 'text-stone-500 hover:text-stone-900'}`}>Stores</button>
          </nav>

          <button 
            onClick={() => setShowCart(true)}
            className="relative p-3 rounded-full bg-stone-50 text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <i className="fa-solid fa-bag-shopping"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'menu' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold mb-4 text-stone-900">Artisan Selection</h2>
              <p className="text-stone-500 text-lg">Every bean is ethically sourced and roasted in small batches to preserve its unique terroir.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MENU_ITEMS.map(item => (
                <MenuCard key={item.id} item={item} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
             <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-stone-900">Personal Barista</h2>
              <p className="text-stone-500 max-w-lg mx-auto">Not sure what to pick? Tell our AI what you're feeling, or start a voice conversation for a truly personalized experience.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Chat Interface */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-400 uppercase tracking-widest">Ask for a Recommendation</label>
                  <textarea 
                    value={baristaInput}
                    onChange={(e) => setBaristaInput(e.target.value)}
                    placeholder="e.g. I need something cold but not too sweet for a rainy afternoon..."
                    className="w-full h-32 bg-stone-50 rounded-2xl p-4 border-none focus:ring-2 focus:ring-amber-500 transition-all resize-none text-stone-800"
                  />
                </div>
                <button 
                  onClick={handleBaristaChat}
                  disabled={isLoadingBarista}
                  className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-3"
                >
                  {isLoadingBarista ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-sparkles text-amber-400"></i>}
                  Get Recommendation
                </button>

                {baristaResponse && (
                  <div className="bg-amber-50 rounded-2xl p-5 text-amber-900 border border-amber-100 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-2 mb-2 font-bold text-amber-700">
                       <i className="fa-solid fa-robot"></i>
                       Barista Suggests:
                    </div>
                    <p className="leading-relaxed italic">{baristaResponse}</p>
                  </div>
                )}
              </div>

              {/* Voice Interface */}
              <LiveBarista />
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-stone-900">Dream Your Drink</h2>
              <p className="text-stone-500">Describe your perfect cup, and our AI will visualize it for you. From "Galaxy Latte" to "Volcanic Espresso".</p>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-stone-100 space-y-8">
              <div className="space-y-3">
                <input 
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe your drink (e.g. A lavender latte with gold leaf and star-shaped foam)"
                  className="w-full bg-stone-50 border-stone-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 transition-all"
                />
                <button 
                  onClick={handleGenerateDrink}
                  disabled={isGenerating}
                  className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? <i className="fa-solid fa-wand-magic-sparkles animate-pulse"></i> : <i className="fa-solid fa-image"></i>}
                  Visualize My Brew
                </button>
              </div>

              {customImage ? (
                <div className="aspect-square w-full bg-stone-100 rounded-2xl overflow-hidden shadow-inner animate-in zoom-in duration-500">
                  <img src={customImage} alt="Custom Drink" className="w-full h-full object-cover" />
                </div>
              ) : isGenerating ? (
                <div className="aspect-square w-full bg-stone-50 rounded-2xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-stone-200">
                   <i className="fa-solid fa-mug-hot text-4xl text-stone-300 animate-bounce"></i>
                   <p className="text-stone-400 font-medium italic">Stirring the AI beans...</p>
                </div>
              ) : (
                <div className="aspect-square w-full bg-stone-50 rounded-2xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-stone-200 text-stone-300">
                   <i className="fa-solid fa-cloud-moon text-6xl opacity-50"></i>
                   <p className="text-sm font-bold uppercase tracking-widest">Awaiting your imagination</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-stone-900">Find Us</h2>
              <p className="text-stone-500">We are growing. Find an Aura Brew near you.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col md:flex-row gap-4">
              <input 
                type="text"
                value={searchLoc}
                onChange={(e) => setSearchLoc(e.target.value)}
                placeholder="Enter city or zip code"
                className="flex-1 bg-stone-50 border-stone-100 rounded-xl px-4 py-3"
              />
              <button 
                onClick={handleFindShops}
                disabled={isLocating}
                className="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
              >
                {isLocating ? 'Searching...' : 'Search'}
              </button>
            </div>

            {locationResults && (
              <div className="bg-white rounded-3xl p-8 border border-stone-100 space-y-6">
                <div className="prose prose-stone">
                  <p className="text-lg leading-relaxed">{locationResults.text}</p>
                </div>
                
                {locationResults.grounding && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locationResults.grounding.map((chunk: any, i: number) => (
                      chunk.maps && (
                        <a 
                          key={i}
                          href={chunk.maps.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-100 transition-colors group"
                        >
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all">
                             <i className="fa-solid fa-location-dot"></i>
                          </div>
                          <div>
                            <div className="font-bold text-stone-800">{chunk.maps.title}</div>
                            <div className="text-xs text-stone-400">Click to view on Maps</div>
                          </div>
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-stone-50 rounded-full">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4">
                  <i className="fa-solid fa-cart-shopping text-6xl opacity-20"></i>
                  <p className="font-medium italic">Your cart is currently empty</p>
                  <button onClick={() => {setShowCart(false); setActiveTab('menu');}} className="text-amber-600 font-bold underline">Go explore our menu</button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} className="w-20 h-20 rounded-xl object-cover" alt={item.name} />
                    <div className="flex-1">
                      <div className="font-bold text-stone-800">{item.name}</div>
                      <div className="text-stone-400 text-sm">{item.quantity} x ${item.price.toFixed(2)}</div>
                    </div>
                    <div className="font-bold text-stone-800">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-stone-100 bg-stone-50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Subtotal</span>
                  <span className="text-xl font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => alert("Checkout simulated!")}
                  className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                >
                  Confirm Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-6 py-3 md:hidden flex justify-between items-center z-40">
        <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center gap-1 ${activeTab === 'menu' ? 'text-amber-600' : 'text-stone-400'}`}>
          <i className="fa-solid fa-list-ul text-lg"></i>
          <span className="text-[10px] font-bold">Menu</span>
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center gap-1 ${activeTab === 'ai' ? 'text-amber-600' : 'text-stone-400'}`}>
          <i className="fa-solid fa-robot text-lg"></i>
          <span className="text-[10px] font-bold">AI Barista</span>
        </button>
        <button onClick={() => setActiveTab('custom')} className={`flex flex-col items-center gap-1 ${activeTab === 'custom' ? 'text-amber-600' : 'text-stone-400'}`}>
          <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
          <span className="text-[10px] font-bold">Custom</span>
        </button>
        <button onClick={() => setActiveTab('locations')} className={`flex flex-col items-center gap-1 ${activeTab === 'locations' ? 'text-amber-600' : 'text-stone-400'}`}>
          <i className="fa-solid fa-map-location-dot text-lg"></i>
          <span className="text-[10px] font-bold">Stores</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
