export const getWhatsAppOrderURL = ({ productName, price, quantity, productUrl }) => {
  const message = `Hello! I want to order from Luxe Bags:

🛍️ Product: ${productName}
💰 Price: Rs. ${price}
🔢 Quantity: ${quantity}
🔗 Link: ${productUrl}

Please confirm availability and share payment details.`;

  const encoded = encodeURIComponent(message);
  const number = import.meta.env.VITE_WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encoded}`;
};
