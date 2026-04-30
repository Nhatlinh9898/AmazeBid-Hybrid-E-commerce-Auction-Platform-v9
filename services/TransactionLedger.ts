import { TransactionRecord, TransactionType, FuturesContract } from '../src/types';
import { p2p as p2pService } from './p2pService';

export class TransactionLedger {
  private static instance: TransactionLedger;
  
  private constructor() {}

  public static getInstance(): TransactionLedger {
    if (!TransactionLedger.instance) {
      TransactionLedger.instance = new TransactionLedger();
    }
    return TransactionLedger.instance;
  }

  /**
   * Sinh mã băm dữ liệu để đảm bảo tính toàn vẹn (Integrity)
   */
  private async generateHash(data: any): Promise<string> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Ghi nhận một giao dịch mới vào Ledger (Auditable Log)
   */
  public async commitTransaction(
    senderId: string, 
    receiverId: string, 
    amount: number, 
    type: TransactionType,
    metadata: Partial<TransactionRecord['metadata']> = {}
  ): Promise<TransactionRecord> {
    const transactionId = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const record: Omit<TransactionRecord, 'metadata'> = {
      id: transactionId,
      senderId,
      receiverId,
      amount,
      currency: 'USD',
      type,
      status: 'CLEARED',
      timestamp: Date.now(),
    };

    const hash = await this.generateHash(record);
    
    const finalRecord: TransactionRecord = {
      ...record,
      metadata: {
        referenceCode: `REF-${Math.random().toString(36).toUpperCase().substr(0, 6)}`,
        hash,
        ...metadata
      }
    };

    // Lưu vào mạng lưới P2P Shielded Ledger
    // Đường dẫn 'audit-ledger' được giám sát bởi QuantumSentinel
    await p2pService.securePut(`ledger/${transactionId}`, finalRecord);
    
    console.log(`[LEDGER] Transaction committed: ${transactionId} | Hash: ${hash.substring(0, 10)}...`);
    return finalRecord;
  }

  /**
   * Tạo Hợp đồng tương lai (Futures Contract)
   */
  public async createFuturesContract(contract: Omit<FuturesContract, 'id' | 'status'>): Promise<FuturesContract> {
    const contractId = `FC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const fullContract: FuturesContract = {
      ...contract,
      id: contractId,
      status: 'OPEN'
    };

    await p2pService.securePut(`futures/${contractId}`, fullContract);
    
    // Ghi log giao dịch ký quỹ (Escrow) liên quan đến hợp đồng
    await this.commitTransaction(
      contract.creatorId,
      'SYSTEM-ESCROW',
      contract.strikePrice * 0.1, // 10% ký quỹ
      'ESCROW_DEPOSIT',
      { contractId }
    );

    return fullContract;
  }

  /**
   * Truy xuất toàn bộ lịch sử giao dịch (Chỉ Admin)
   */
  public async getAuditHistory(): Promise<TransactionRecord[]> {
    return new Promise((resolve) => {
      const records: TransactionRecord[] = [];
      p2pService.gun.get('ledger').map().once((data: any) => {
        if (data && data.id) records.push(data);
      });
      
      setTimeout(() => resolve(records.sort((a, b) => b.timestamp - a.timestamp)), 1500);
    });
  }
}

export const ledger = TransactionLedger.getInstance();
