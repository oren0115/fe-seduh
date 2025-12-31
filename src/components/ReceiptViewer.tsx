import { Transaction } from '@/lib/api-services';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, Download, X } from 'lucide-react';

interface ReceiptViewerProps {
  transaction: Transaction;
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export default function ReceiptViewer({
  transaction,
  onClose,
  onPrint,
  onDownload,
}: ReceiptViewerProps) {
  // Calculate subtotal from items
  const subtotal = transaction.items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = subtotal - transaction.total;
  const tax = 0; // Assuming no tax for now

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Receipt</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Receipt Content - Print Friendly */}
      <div
        className="bg-white dark:bg-gray-900 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 receipt-content"
        style={{
          fontFamily: 'monospace',
          maxWidth: '400px',
          margin: '0 auto',
        }}
      >
        {/* Print-only styles */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .receipt-content, .receipt-content * {
                visibility: visible;
              }
              .receipt-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        <div className="receipt-content space-y-2 text-sm">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-2">
            <h1 className="text-lg font-bold">COFFEE SHOP POS</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              123 Coffee Street, Jakarta
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Phone: +62 123 456 789
            </p>
          </div>

          {/* Transaction Info */}
          <div className="space-y-1 border-b border-dashed border-gray-300 dark:border-gray-700 pb-2 mb-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transaction:</span>
              <span className="font-semibold">{transaction.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span>{formatDateTime(transaction.createdAt)}</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 border-b border-dashed border-gray-300 dark:border-gray-700 pb-2 mb-2">
            <div className="font-semibold">Items:</div>
            {transaction.items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="font-medium">{item.productName}</div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 pl-2">
                  <span>{item.qty} x {formatCurrency(item.price)}</span>
                  <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 border-b border-dashed border-gray-300 dark:border-gray-700 pb-2 mb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Discount:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1 border-t border-dashed border-gray-300 dark:border-gray-700">
              <span>TOTAL:</span>
              <span>{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-1 border-b border-dashed border-gray-300 dark:border-gray-700 pb-2 mb-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Payment:</span>
              <span className="font-semibold">{transaction.paymentMethod}</span>
            </div>
            {transaction.cashReceived && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cash:</span>
                  <span>{formatCurrency(transaction.cashReceived)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Change:</span>
                  <span className="font-semibold">{formatCurrency(transaction.change || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-2 border-t-2 border-dashed border-gray-400">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Thank you for your purchase!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Please come again
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Hidden on Print */}
      <div className="flex justify-end gap-2 no-print">
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>
    </div>
  );
}

