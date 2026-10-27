package com.fashionstore.order.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CheckoutRequest {

    @NotBlank(message = "Họ và tên người nhận không được để trống")
    @Size(max = 150, message = "Họ và tên không vượt quá 150 ký tự")
    private String shippingName;

    @NotBlank(message = "Số điện thoại nhận hàng không được để trống")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại nhận hàng không đúng định dạng Việt Nam")
    private String shippingPhone;

    @NotBlank(message = "Địa chỉ nhận hàng chi tiết không được để trống")
    @Size(max = 255, message = "Địa chỉ không vượt quá 255 ký tự")
    private String shippingAddress;

    @Size(max = 100, message = "Tỉnh/Thành phố không vượt quá 100 ký tự")
    private String shippingCity;

    @Size(max = 100, message = "Quận/Huyện không vượt quá 100 ký tự")
    private String shippingDistrict;

    @Size(max = 100, message = "Phường/Xã không vượt quá 100 ký tự")
    private String shippingWard;

    @Size(max = 500, message = "Ghi chú giao hàng không vượt quá 500 ký tự")
    private String shippingNote;

    @Size(max = 50, message = "Mã voucher không vượt quá 50 ký tự")
    private String couponCode;

    public CheckoutRequest() {}

    public CheckoutRequest(
            String shippingName,
            String shippingPhone,
            String shippingAddress,
            String shippingCity,
            String shippingDistrict,
            String shippingWard,
            String shippingNote,
            String couponCode) {
        this.shippingName = shippingName;
        this.shippingPhone = shippingPhone;
        this.shippingAddress = shippingAddress;
        this.shippingCity = shippingCity;
        this.shippingDistrict = shippingDistrict;
        this.shippingWard = shippingWard;
        this.shippingNote = shippingNote;
        this.couponCode = couponCode;
    }

    public String getShippingName() {
        return shippingName;
    }

    public void setShippingName(String shippingName) {
        this.shippingName = shippingName;
    }

    public String getShippingPhone() {
        return shippingPhone;
    }

    public void setShippingPhone(String shippingPhone) {
        this.shippingPhone = shippingPhone;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getShippingCity() {
        return shippingCity;
    }

    public void setShippingCity(String shippingCity) {
        this.shippingCity = shippingCity;
    }

    public String getShippingDistrict() {
        return shippingDistrict;
    }

    public void setShippingDistrict(String shippingDistrict) {
        this.shippingDistrict = shippingDistrict;
    }

    public String getShippingWard() {
        return shippingWard;
    }

    public void setShippingWard(String shippingWard) {
        this.shippingWard = shippingWard;
    }

    public String getShippingNote() {
        return shippingNote;
    }

    public void setShippingNote(String shippingNote) {
        this.shippingNote = shippingNote;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(String couponCode) {
        this.couponCode = couponCode;
    }
}

