const processors = [
    // Ryzen Processors
    { name: "Ryzen 3 1200", value: "1200" },
    { name: "Ryzen 3 1300X", value: "1300X" },
    { name: "Ryzen 3 2200G", value: "2200G" },
    { name: "Ryzen 3 2300X", value: "2300X" },
    { name: "Ryzen 3 3200G", value: "3200G" },
    { name: "Ryzen 3 3100", value: "3100" },
    { name: "Ryzen 3 3300X", value: "3300X" },

    { name: "Ryzen 5 1400", value: "1400" },
    { name: "Ryzen 5 1500X", value: "1500X" },
    { name: "Ryzen 5 1600", value: "1600" },
    { name: "Ryzen 5 1600X", value: "1600X" },
    { name: "Ryzen 5 2400G", value: "2400G" },
    { name: "Ryzen 5 2600", value: "2600" },
    { name: "Ryzen 5 2600X", value: "2600X" },
    { name: "Ryzen 5 3400G", value: "3400G" },
    { name: "Ryzen 5 3600", value: "3600" },
    { name: "Ryzen 5 3600X", value: "3600X" },
    { name: "Ryzen 5 3600XT", value: "3600XT" },
    { name: "Ryzen 5 4500", value: "4500" },
    { name: "Ryzen 5 4600G", value: "4600G" },
    { name: "Ryzen 5 4600GE", value: "4600GE" },
    { name: "Ryzen 5 5500", value: "5500" },
    { name: "Ryzen 5 5600", value: "5600" },
    { name: "Ryzen 5 5600X", value: "5600X" },
    { name: "Ryzen 5 5600G", value: "5600G" },
    { name: "Ryzen 5 5600GE", value: "5600GE" },
    { name: "Ryzen 5 7500F", value: "7500F" },
    { name: "Ryzen 5 7600X", value: "7600X" },

    { name: "Ryzen 7 1700", value: "1700" },
    { name: "Ryzen 7 1700X", value: "1700X" },
    { name: "Ryzen 7 1800X", value: "1800X" },
    { name: "Ryzen 7 2700", value: "2700" },
    { name: "Ryzen 7 2700X", value: "2700X" },
    { name: "Ryzen 7 3700X", value: "3700X" },
    { name: "Ryzen 7 3800X", value: "3800X" },
    { name: "Ryzen 7 3800XT", value: "3800XT" },
    { name: "Ryzen 7 5700G", value: "5700G" },
    { name: "Ryzen 7 5700X", value: "5700X" },
    { name: "Ryzen 7 5700X3D", value: "5700X3D" },

    { name: "Ryzen 7 5800X", value: "5800X" },
    { name: "Ryzen 7 5800X3D", value: "5800X3D" },
    { name: "Ryzen 7 7700X", value: "7700X" },
    { name: "Ryzen 7 7800X3D", value: "7800X3D" },

    { name: "Ryzen 9 3900X", value: "3900X" },
    { name: "Ryzen 9 3900XT", value: "3900XT" },
    { name: "Ryzen 9 3950X", value: "3950X" },
    { name: "Ryzen 9 5900X", value: "5900X" },
    { name: "Ryzen 9 5950X", value: "5950X" },
    { name: "Ryzen 9 7900X", value: "7900X" },
    { name: "Ryzen 9 7900X3D", value: "7900X3D" },

    { name: "Ryzen 9 7950X", value: "7950X" },
    { name: "Ryzen 9 7950X3D", value: "7950X3D" },

    // Intel 10th Gen Processors
    { name: "Core i3-10100", value: "10100" },
    { name: "Core i3-10300", value: "10300" },
    { name: "Core i3-10320", value: "10320" },
    { name: "Core i5-10400", value: "10400" },
    { name: "Core i5-10500", value: "10500" },
    { name: "Core i5-10600", value: "10600" },
    { name: "Core i5-10600K", value: "10600K" },
    { name: "Core i7-10700", value: "10700" },
    { name: "Core i7-10700K", value: "10700K" },
    { name: "Core i9-10900", value: "10900" },
    { name: "Core i9-10900K", value: "10900K" },

    // Intel 11th Gen Processors
    { name: "Core i3-11100", value: "11100" },
    { name: "Core i3-11300", value: "11300" },
    { name: "Core i5-11400", value: "11400" },
    { name: "Core i5-11500", value: "11500" },
    { name: "Core i5-11600K", value: "11600K" },
    { name: "Core i7-11700", value: "11700" },
    { name: "Core i7-11700K", value: "11700K" },
    { name: "Core i9-11900", value: "11900" },
    { name: "Core i9-11900K", value: "11900K" },

    // Intel 12th Gen Processors
    { name: "Core i3-12100", value: "12100" },
    { name: "Core i3-12300", value: "12300" },
    { name: "Core i5-12400", value: "12400" },
    { name: "Core i5-12600K", value: "12600K" },
    { name: "Core i7-12700", value: "12700" },
    { name: "Core i7-12700K", value: "12700K" },
    { name: "Core i9-12900", value: "12900" },
    { name: "Core i9-12900K", value: "12900K" },

    // Intel 13th Gen Processors
    { name: "Core i3-13100", value: "13100" },
    { name: "Core i5-13400", value: "13400" },
    { name: "Core i5-13600K", value: "13600K" },
    { name: "Core i7-13700", value: "13700" },
    { name: "Core i7-13700K", value: "13700K" },
    { name: "Core i9-13900", value: "13900" },
    { name: "Core i9-13900K", value: "13900K" },

    // Intel 14th Gen Processors
    { name: "Core i3-14100", value: "14100" },
    { name: "Core i5-14400", value: "14400" },
    { name: "Core i5-14600K", value: "14600K" },
    { name: "Core i7-14700", value: "14700" },
    { name: "Core i7-14700K", value: "14700K" },
    { name: "Core i9-14900", value: "14900" },
    { name: "Core i9-14900K", value: "14900K" },
  ];

  const gpus = [
    // NVIDIA GeForce GPUs
    { name: "GeForce GTX 1050", value: "GTX 1050" },
    { name: "GeForce GTX 1050 Ti", value: "GTX 1050 Ti" },
    { name: "GeForce GTX 1060", value: "GTX 1060" },
    { name: "GeForce GTX 1070", value: "GTX 1070" },
    { name: "GeForce GTX 1070 Ti", value: "GTX 1070 Ti" },
    { name: "GeForce GTX 1080", value: "GTX 1080" },
    { name: "GeForce GTX 1080 Ti", value: "GTX 1080 Ti" },

    { name: "GeForce RTX 2060", value: "RTX 2060" },
    { name: "GeForce RTX 2060 Super", value: "RTX 2060 Super" },
    { name: "GeForce RTX 2070", value: "RTX 2070" },
    { name: "GeForce RTX 2070 Super", value: "RTX 2070 Super" },
    { name: "GeForce RTX 2080", value: "RTX 2080" },
    { name: "GeForce RTX 2080 Super", value: "RTX 2080 Super" },
    { name: "GeForce RTX 2080 Ti", value: "RTX 2080 Ti" },

    { name: "GeForce RTX 3060", value: "RTX 3060" },
    { name: "GeForce RTX 3060 Ti", value: "RTX 3060 Ti" },
    { name: "GeForce RTX 3070", value: "RTX 3070" },
    { name: "GeForce RTX 3070 Ti", value: "RTX 3070 Ti" },
    { name: "GeForce RTX 3080", value: "RTX 3080" },
    { name: "GeForce RTX 3080 Ti", value: "RTX 3080 Ti" },
    { name: "GeForce RTX 3090", value: "RTX 3090" },
    { name: "GeForce RTX 3090 Ti", value: "RTX 3090 Ti" },

    { name: "GeForce RTX 4060", value: "RTX 4060" },
    { name: "GeForce RTX 4060 Ti", value: "RTX 4060 Ti" },
    { name: "GeForce RTX 4070", value: "RTX 4070" },
    { name: "GeForce RTX 4070 Ti", value: "RTX 4070 Ti" },
    { name: "GeForce RTX 4080", value: "RTX 4080" },
    { name: "GeForce RTX 4090", value: "RTX 4090" },

    // AMD Radeon GPUs
    { name: "Radeon RX 460", value: "RX 460" },
    { name: "Radeon RX 470", value: "RX 470" },
    { name: "Radeon RX 480", value: "RX 480" },
    { name: "Radeon RX 550", value: "RX 550" },
    { name: "Radeon RX 560", value: "RX 560" },
    { name: "Radeon RX 570", value: "RX 570" },
    { name: "Radeon RX 580", value: "RX 580" },
    { name: "Radeon RX 590", value: "RX 590" },

    { name: "Radeon RX 5500 XT", value: "RX 5500 XT" },
    { name: "Radeon RX 5600 XT", value: "RX 5600 XT" },
    { name: "Radeon RX 5700", value: "RX 5700" },
    { name: "Radeon RX 5700 XT", value: "RX 5700 XT" },

    { name: "Radeon RX 6600", value: "RX 6600" },
    { name: "Radeon RX 6600 XT", value: "RX 6600 XT" },
    { name: "Radeon RX 6700 XT", value: "RX 6700 XT" },
    { name: "Radeon RX 6800", value: "RX 6800" },
    { name: "Radeon RX 6800 XT", value: "RX 6800 XT" },
    { name: "Radeon RX 6900 XT", value: "RX 6900 XT" },

    { name: "Radeon RX 7600", value: "RX 7600" },
    { name: "Radeon RX 7700 XT", value: "RX 7700 XT" },
    { name: "Radeon RX 7800 XT", value: "RX 7800 XT" },
    { name: "Radeon RX 7900 XT", value: "RX 7900 XT" },
    { name: "Radeon RX 7900 XTX", value: "RX 7900 XTX" },
  ];
