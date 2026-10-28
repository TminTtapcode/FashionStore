package com.fashionstore.inventory.domain;

public enum InventoryMovementType {
    OPENING_BALANCE,    // Số dư tồn kho ban đầu tại thời điểm cutover
    INITIAL_STOCK,      // Tồn kho khởi tạo khi tạo mới biến thể
    ORDER_DEDUCT,       // Trừ tồn kho khi khách hàng đặt đơn (Available-to-Sell)
    CANCEL_RESTORE,     // Phục hồi tồn kho khi đơn hàng bị hủy trước khi giao
    RETURN_RESTORE,     // Phục hồi tồn kho khi hàng giao thất bại thực tế quay về kho
    STOCK_RECEIPT,      // Nhập hàng bổ sung từ xưởng / nhà cung cấp
    MANUAL_ADJUSTMENT   // Điều chỉnh kiểm kê, sai lệch số lượng hoặc hàng hỏng
}
