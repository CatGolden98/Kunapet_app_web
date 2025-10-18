import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, Star, MapPin, Phone, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/WhatsApp Image 2025-10-08 at 3.14.40 PM.png';

interface ServiceListingNewProps {
  onNavigate: (screen: string, data?: any) => void;
  category: string;
  onAddToCart?: (item: { id: string; name: string; price: number; image?: string }) => void;
}

const ServiceListingNew: React.FC<ServiceListingNewProps> = ({ onNavigate, category, onAddToCart }) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRelated, setShowRelated] = useState<{ open: boolean; providerName?: string } | null>(null);
  const [relatedItems, setRelatedItems] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    species: [] as string[],
    services: [] as string[],
    minRating: 0,
    priceRange: [0, 500] as [number, number],
  });

  const categoryConfig = {
    veterinary: {
      title: 'Veterinarios Cerca de Ti',
      placeholder: 'Buscar veterinarios...',
      serviceTypes: ['Consulta General', 'Emergencia 24h', 'Vacunación', 'Cirugía', 'Laboratorio'],
    },
    walking: {
      title: 'Paseadores Profesionales',
      placeholder: 'Buscar paseadores...',
      serviceTypes: ['Paseo Individual', 'Paseo Grupal', 'Entrenamiento', 'Socialización'],
    },
    grooming: {
      title: 'Servicios de Grooming',
      placeholder: 'Buscar grooming...',
      serviceTypes: ['Baño Completo', 'Corte de Pelo', 'Limpieza Dental', 'Corte de Uñas', 'Spa'],
    },
    hospedaje: { // coincide con la navegación desde Home
      title: 'Hospedaje para Mascotas',
      placeholder: 'Buscar hospedaje...',
      serviceTypes: ['Día Completo', 'Noche', 'Fin de Semana', 'Vacaciones'],
    },
    boarding: { // dejamos alias por si hay navegaciones antiguas
      title: 'Hospedaje para Mascotas',
      placeholder: 'Buscar hospedaje...',
      serviceTypes: ['Día Completo', 'Noche', 'Fin de Semana', 'Vacaciones'],
    },
  };

  const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.veterinary;

  useEffect(() => {
    loadProviders();
  }, [category]);

  useEffect(() => {
    applyFilters();
  }, [providers, filters, searchQuery]);

  const loadProviders = async () => {
    setLoading(true);

    // 1) Obtener services por categoría (solo ids y precio)
    const { data: svc, error } = await supabase
      .from('services')
      .select('provider_id, price')
      .eq('category', category);

    if (error) {
      console.error('[services][error]', error);
      setProviders([]);
      setLoading(false);
      return;
    }

    // Logs de diagnóstico
    console.info('[services]', category, 'rows:', (svc || []).length, (svc || []).slice(0, 3));
    const rows = svc || [];
    if (rows.length === 0) {
      setProviders([]);
      setLoading(false);
      return;
    }

    // 2) Mapa de precio mínimo por provider
    const priceMap = new Map<string, number>();
    rows.forEach((r: any) => {
      const cur = priceMap.get(r.provider_id);
      if (cur == null || r.price < cur) priceMap.set(r.provider_id, r.price);
    });

    // 3) Consultar providers por IN
    const providerIds = Array.from(priceMap.keys());
    console.info('[providerIds]', providerIds.length, providerIds.slice(0, 5));
    const { data: provs, error: pErr } = await supabase
      .from('providers')
      .select('*')
      .in('id', providerIds)
      .order('rating', { ascending: false });

    if (pErr) {
      console.error('[providers][error]', pErr);
      setProviders([]);
      setLoading(false);
      return;
    }

    const list = (provs || []).map((p: any) => ({
      ...p,
      services: [{ price: priceMap.get(p.id) }],
    }));

    console.info('[providers list]', list.length, list.map((p: any) => p.business_name).slice(0, 5));
    setProviders(list);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...providers];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.business_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter(p => p.rating >= filters.minRating);
    }

    setFilteredProviders(filtered);
  };

  const openRelated = async (provider: any) => {
    setShowRelated({ open: true, providerName: provider.business_name });
    const { data } = await supabase
      .from('products')
      .select('id,name,price,photos')
      .or(`category.eq.${category},category.is.null`)
      .limit(8);
    setRelatedItems(data || []);
  };

  const toggleSpeciesFilter = (species: string) => {
    setFilters(prev => ({
      ...prev,
      species: prev.species.includes(species)
        ? prev.species.filter(s => s !== species)
        : [...prev.species, species],
    }));
  };

  const toggleServiceFilter = (service: string) => {
    setFilters(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  return (
    <div className="screen-container bg-gray-50">
      <div className="bg-white px-6 pt-8 pb-6 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <img src={logoImg} alt="Kunapet" className="h-8" />
          <div className="w-10"></div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">{config.title}</h1>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={config.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold flex items-center justify-center hover:bg-primary-600 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5 mr-2" />
          Filtros
        </button>
      </div>

      <div className="px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No se encontraron resultados</p>
            <p className="text-sm text-gray-500">Intenta ajustar tus filtros de búsqueda</p>
          </div>
        ) : (
          filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start">
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0 mr-4 overflow-hidden">
                  {provider.logo_url ? (
                    <img src={provider.logo_url} alt={provider.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                      {provider.business_name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-800 mb-1 cursor-pointer" onClick={() => onNavigate('provider-detail', { providerId: provider.id })}>{provider.business_name}</h3>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="font-semibold text-gray-700">{provider.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-500 text-sm ml-1">({provider.total_reviews} reseñas)</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    <span>{provider.address || '1.2 km'}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {provider.rating >= 4.5 ? (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                        Disponible Ahora
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">Desde S/ {provider.services?.[0]?.price || 50}</span>
                    )}
                    {provider.verified && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        ✓ Verificado
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => openRelated(provider)}
                    className="text-xs px-2 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Ver relacionados
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Filtros</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Especie de Mascota</h3>
                <div className="flex gap-3">
                  {['Perros', 'Gatos', 'Otros'].map((species) => (
                    <button
                      key={species}
                      onClick={() => toggleSpeciesFilter(species)}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        filters.species.includes(species)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {species}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Servicios Específicos</h3>
                <div className="space-y-2">
                  {config.serviceTypes.map((service) => (
                    <label key={service} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.services.includes(service)}
                        onChange={() => toggleServiceFilter(service)}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Calificación Mínima</h3>
                <div className="flex gap-2">
                  {[0, 3.5, 4.0, 4.5, 5.0].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ ...filters, minRating: rating })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        filters.minRating === rating
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rating === 0 ? 'Todas' : `${rating}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Rango de Precio</h3>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      setFilters({ ...filters, priceRange: [0, parseInt(e.target.value)] })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>S/ 0</span>
                    <span className="font-semibold text-primary-600">S/ {filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setFilters({
                    species: [],
                    services: [],
                    minRating: 0,
                    priceRange: [0, 500],
                  });
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 bg-secondary-500 text-white rounded-xl font-semibold hover:bg-secondary-600 transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
   

      {showRelated?.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Relacionados {showRelated.providerName ? `- ${showRelated.providerName}` : ''}</h2>
              <button onClick={() => setShowRelated(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            {relatedItems.length === 0 ? (
              <p className="text-gray-600">No hay productos relacionados por ahora.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {relatedItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border">
                    <div className="w-full h-24 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                      {Array.isArray(item.photos) && item.photos[0] ? (
  <img
    src={item.photos[0]}
    alt={item.name}
    loading="lazy"
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    className="w-full h-full object-cover"
  />
) : null}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{item.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary-600">S/ {Number(item.price).toFixed(2)}</span>
                      {onAddToCart && (
                        <button
                          onClick={() => onAddToCart({ id: item.id, name: item.name, price: item.price, image: Array.isArray(item.photos) && item.photos[0] ? item.photos[0] : undefined })}
                          className="text-xs px-2 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                        >
                          Añadir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceListingNew;
