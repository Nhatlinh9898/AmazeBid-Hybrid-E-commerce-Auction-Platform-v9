/**
 * LOCAL PROCESSING SERVICE
 * Xử lý dữ liệu trực tiếp trên trình duyệt (Direct/Client-side)
 * Không sử dụng AI API, không tốn phí, bảo mật cao.
 */
export const localProcessingService = {
  /**
   * OCR Hóa đơn cục bộ bằng Tesseract.js (nạp động)
   */
  async scanInvoice(imageFile: File | string): Promise<any> {
    console.log("Bắt đầu OCR cục bộ bằng Tesseract.js...");
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('vie+eng');
      const result = await worker.recognize(imageFile);
      await worker.terminate();

      const text = result.data.text;
      console.log("Kết quả OCR:", text);

      // Phân tích văn bản bằng Regex (Heuristic Parsing)
      return this.parseProductFromText(text);
    } catch (error) {
      console.error("Local OCR Error:", error);
      return null;
    }
  },

  /**
   * Phân tích văn bản thô để tìm thông tin sản phẩm (Thuật toán Heuristic)
   */
  parseProductFromText(text: string) {
    const lines = text.split('\n');
    let title = "";
    let price = "";
    let costPrice = "";
    
    // Tìm kiếm các mẫu số (giá tiền)
    const priceMatches = text.match(/(\d{1,3}([,.]\d{3})*(\d+)?)/g);
    if (priceMatches && priceMatches.length >= 1) {
      const numbers = priceMatches
        .map(n => parseFloat(n.replace(/[,.]/g, '')))
        .filter(n => n > 1000)
        .sort((a, b) => b - a);
      
      if (numbers.length > 0) price = numbers[0].toString();
      if (numbers.length > 1) costPrice = numbers[1].toString();
    }

    // Lấy dòng đầu tiên có vẻ là tên sản phẩm
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && !trimmed.match(/^[0-9\W]+$/)) {
        title = trimmed;
        break;
      }
    }

    return {
      title: title || "Sản phẩm từ hóa đơn",
      description: "Dữ liệu được trích xuất tự động từ thiết bị xử lý cục bộ.",
      category: "Electronics",
      price: price || "0",
      costPrice: costPrice || price || "0",
      totalStock: "1"
    };
  },

  /**
   * Xử lý file CSV/Excel cục bộ
   */
  async parseInventoryFile(file: File): Promise<any> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      const Papa = (await import('papaparse')).default;
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const item: any = results.data[0];
              resolve({
                title: item.title || item.name || Object.values(item)[0],
                description: item.description || "Nhập từ file CSV",
                price: item.price || "0",
                costPrice: item.costPrice || "0",
                totalStock: item.stock || "10",
                category: item.category || "General"
              });
            } else {
              resolve(null);
            }
          },
          error: (err: Error) => reject(err)
        });
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      const XLSX = await import('xlsx');
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);
          
          if (jsonData.length > 0) {
            const item = jsonData[0];
            resolve({
              title: item.title || item.name || item.ProductName || "Sp từ Excel",
              description: item.description || "Nhập từ file Excel",
              price: item.price || item.Price || "0",
              costPrice: item.costPrice || "0",
              totalStock: item.stock || item.Quantity || "1",
              category: item.category || "General"
            });
          } else {
            resolve(null);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    }
    return null;
  }
};
