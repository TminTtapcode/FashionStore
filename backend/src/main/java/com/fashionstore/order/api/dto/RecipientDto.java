package com.fashionstore.order.api.dto;

public class RecipientDto {

    private String name;
    private String phone;
    private String address;
    private String city;
    private String district;
    private String ward;
    private String note;

    public RecipientDto() {}

    public RecipientDto(String name, String phone, String address, String city, String district, String ward, String note) {
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.district = district;
        this.ward = ward;
        this.note = note;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public String getCity() {
        return city;
    }

    public String getDistrict() {
        return district;
    }

    public String getWard() {
        return ward;
    }

    public String getNote() {
        return note;
    }
}
