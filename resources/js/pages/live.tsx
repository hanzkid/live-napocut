import { useState } from "react";
import { VideoPlayer } from "@/components/livestream/VideoPlayer";
import { ChatOverlay } from "@/components/livestream/ChatOverlay";
import { ChatInput } from "@/components/livestream/ChatInput";
import { ProductCarousel } from "@/components/livestream/ProductCarousel";
import { ProductModal } from "@/components/livestream/ProductModal";
import { Product, ChatMessage } from "@/types/livestream";

const products: Product[] = [
    {
      id: "1",
      name: "Pre-owned Hermes Birkin 30 Bleu Izmir Shiny Niloticus Crocodile Palladium Hardware",
      price: 50500,
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
        "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80",
      ],
      description: "Pre-owned Hermes Birkin 30 Bleu Izmir Shiny Niloticus Crocodile Palladium Hardware"
    },
    {
      id: "2",
      name: "Chanel Classic Flap Bag Medium Black Lambskin Gold Hardware",
      price: 8500,
      image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
      ],
      description: "Chanel Classic Flap Bag Medium Black Lambskin Gold Hardware"
    },
    {
      id: "3",
      name: "Louis Vuitton Neverfull MM Monogram Canvas",
      price: 1890,
      image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
      ],
      description: "Louis Vuitton Neverfull MM Monogram Canvas"
    },
  ];
const initialMessages: ChatMessage[] = [
  {
    id: "1",
    username: "ModAve",
    message: "Welcome to ModAve Live!",
    timestamp: new Date(),
    isSystem: true,
  },
  {
    id: "2",
    username: "Victoria",
    message: "WOW",
    timestamp: new Date(),
  },
];

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [messages] = useState<ChatMessage[]>(initialMessages);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video Player */}
      <VideoPlayer  />

      {/* Chat Overlay */}
      <div className="absolute bottom-44 left-4 right-4 z-20">
        <ChatOverlay messages={messages} />
      </div>

      {/* Chat Input */}
      <div className="absolute bottom-24 left-0 right-0 z-20">
        <ChatInput />
      </div>

      {/* Product Carousel */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <ProductCarousel
          products={products}
          onProductClick={setSelectedProduct}
        />
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Index;
