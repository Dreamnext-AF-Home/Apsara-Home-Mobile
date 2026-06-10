import { useQuery } from "@tanstack/react-query"
import { productService, type Product } from "../../services/productService"

interface UseProductDetailOptions {
  productId: number
  token?: string | null
  enabled?: boolean
}

export const useProductDetail = ({
  productId,
  token,
  enabled = true,
}: UseProductDetailOptions) => {
  return useQuery<Product>({
    queryKey: ["product-detail", token, productId],
    queryFn: async () =>
      productService.getProductById(productId, token ?? undefined),
    enabled: enabled && !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
