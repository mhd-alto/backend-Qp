import { DemoCampaignsSeedService } from "./demo-campaigns.seed";

describe("DemoCampaignsSeedService", () => {
  it("skips creating a coupon when one already exists for the same campaign and user", async () => {
    const manager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const campaignsRepository = {
      findOne: jest.fn(),
      manager,
    };

    const usersRepository = {
      findOne: jest.fn(),
    };

    const sourcesRepository = {
      findOne: jest.fn(),
    };

    const service = new DemoCampaignsSeedService(
      campaignsRepository as any,
      {} as any,
      {} as any,
      {} as any,
      sourcesRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      usersRepository as any,
    );

    const customer = { id: "customer-id", email: "customer@couponhub-demo.sy" };
    const campaign = {
      id: "campaign-id",
      publicSlug: "beit-al-sham-family-friday",
    };
    const source = {
      id: "source-id",
      campaignId: campaign.id,
      sourceType: "WHATSAPP",
    };

    usersRepository.findOne.mockResolvedValue(customer);
    campaignsRepository.findOne.mockResolvedValue(campaign);
    sourcesRepository.findOne.mockResolvedValue(source);
    manager.findOne.mockImplementation(async (_entity, options) => {
      if (
        options?.where?.campaignId === campaign.id &&
        options?.where?.userId === customer.id
      ) {
        return { id: "existing-coupon" };
      }

      return null;
    });

    await (service as any).ensureTestCoupons(
      new Date("2026-01-01T00:00:00.000Z"),
    );

    expect(manager.findOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        where: expect.objectContaining({
          campaignId: campaign.id,
          userId: customer.id,
        }),
      }),
    );
    expect(manager.save).not.toHaveBeenCalled();
  });
});
