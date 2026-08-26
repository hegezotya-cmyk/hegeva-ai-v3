SELECT
  u.plan,
  s.subscriptionStatus,
  s.cancelAtPeriodEnd,
  CASE WHEN s.stripeCustomerId LIKE 'cus_test_%' THEN 1 ELSE 0 END AS testCustomer,
  CASE WHEN s.stripeSubscriptionId LIKE 'sub_test_%' THEN 1 ELSE 0 END AS testSubscription
FROM user_plans AS u
JOIN stripe_customers AS s ON s.userId = u.userId
WHERE u.userId = 'stripe-lifecycle-user';
