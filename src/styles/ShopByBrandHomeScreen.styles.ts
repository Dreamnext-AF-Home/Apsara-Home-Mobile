import { StyleSheet, Dimensions } from "react-native"
import { Colors } from "../constants/colors"
const { width } = Dimensions.get("window")

export { width }
const styles = StyleSheet.create({
  voucherSectionContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  voucherHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voucherContent: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  voucherSubtitle: {
    fontSize: 12,
    fontWeight: "400",
  },
  vouchersGrid: {
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  voucherCard: {
    width: width * 0.7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.sky,
    flexDirection: "row",
    overflow: "hidden",
    paddingVertical: 8,
  },
  voucherCardLeft: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  discountBox: {
    alignItems: "center",
  },
  discountText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.sky,
  },
  discountLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.sky,
  },
  voucherCardDivider: {
    width: 1,
    height: "80%",
    backgroundColor: Colors.sky,
    opacity: 0.3,
  },
  voucherCardRight: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  voucherCardDesc: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  voucherCardCode: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  voucherCardMinSpend: {
    fontSize: 10,
    fontWeight: "400",
    marginBottom: 6,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  featuredSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  featuredHeaderRow: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  featuredGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  featuredItemWrap: {
    width: width * 0.46,
  },
  productsSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  masonryGrid: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: "hidden",
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  masonryItem: {
    width: "100%",
  },
  dummyCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  dummyImageContainer: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  dummyContent: {
    padding: 12,
    gap: 6,
  },
  dummyLine: {
    height: 8,
    borderRadius: 4,
    width: "100%",
  },
  dummyImage: {
    width: 40,
    height: 40,
  },
  emptyContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  bannerContainer: {
    height: 180,
    overflow: "hidden",
    borderRadius: 8,
  },
  carouselContent: {
    alignItems: "center",
  },
  bannerImage: {
    width: width,
    height: 180,
  },
  carouselIndicators: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bestProductsSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  bestProductsHeader: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bestProductsTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  bestProductsGrid: {
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "stretch",
  },
  bestProductsBanner: {
    width: "100%",
    height: 150,
  },
})

export default styles
