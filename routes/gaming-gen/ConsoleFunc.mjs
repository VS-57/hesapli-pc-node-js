// Product linklerini toplamak için boş bir dizi oluşturuyoruz
const productLinks = [];

// Tüm ürün öğelerini seçiyoruz
const productItems = document.querySelectorAll(
  "li.product a.woocommerce-LoopProduct-link"
);

// Her bir ürün öğesinden href değerini alıp productLinks dizisine ekliyoruz
productItems.forEach((item) => {
  productLinks.push(item.href);
});

// Linkleri product_links.txt dosyasına yazmak için Blob ve download işlemlerini kullanıyoruz
const blob = new Blob([productLinks.join("\n")], { type: "text/plain" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "product_links.txt";
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

// Konsola productLinks dizisini yazdırıyoruz
console.log(productLinks);
