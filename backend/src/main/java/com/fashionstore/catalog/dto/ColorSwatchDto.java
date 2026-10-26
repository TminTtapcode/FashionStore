package com.fashionstore.catalog.dto;

public class ColorSwatchDto {

    private String name;
    private String hex;

    public ColorSwatchDto() {}

    public ColorSwatchDto(String name, String hex) {
        this.name = name;
        this.hex = hex;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHex() {
        return hex;
    }

    public void setHex(String hex) {
        this.hex = hex;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ColorSwatchDto that = (ColorSwatchDto) o;
        return java.util.Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(name);
    }
}
