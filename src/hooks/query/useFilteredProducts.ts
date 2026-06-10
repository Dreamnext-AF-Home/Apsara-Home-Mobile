import { useQuery } from "@tanstack/react-query"
import { productService, type Product } from "../../services/productService"

interface UseFilteredProductsOptions {
  token?: string | null
  catid?: number
  brandType?: number
  roomType?: number
  enabled?: boolean
}

export const useFilteredProducts = ({
  token,
  catid,
  brandType,
  roomType,
  enabled = true,
}: UseFilteredProductsOptions) => {
  return useQuery<Product[]>({
    queryKey: [
      "filtered-products",
      token,
      catid ?? null,
      brandType ?? null,
      roomType ?? null,
    ],
    queryFn: async () => {
      const t = token || undefined
      if (catid) return productService.getProductsByCategory(catid, t)
      if (brandType) return productService.getProductsByBrand(brandType, t)
      if (roomType) return productService.getProductsByRoom(roomType, t)
      return productService.getProducts(t)
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
