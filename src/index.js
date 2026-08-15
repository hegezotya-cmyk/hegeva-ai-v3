// =========================================
// HEGEVA AI V34.7
// STRIPE TEST CHECKOUT BACKEND
// =========================================

function getPublicAppUrl() {
  const configured =
    typeof env.PUBLIC_APP_URL === "string"
      ? env.PUBLIC_APP_URL.trim()
      : "";

  if (configured) {
    try {
      const parsed = new URL(configured);

      if (parsed.protocol === "https:") {
        return parsed.origin;
      }
    } catch {}
  }

  return url.origin;
}

function getStripePriceId(plan) {
  if (plan === "premium") {
    return typeof env.STRIPE_PREMIUM_PRICE_ID === "string"
      ? env.STRIPE_PREMIUM_PRICE_ID.trim()
      : "";
  }

  if (plan === "pro") {
    return typeof env.STRIPE_PRO_PRICE_ID === "string"
      ? env.STRIPE_PRO_PRICE_ID.trim()
      : "";
  }

  return "";
}

function stripeTestSecretReady() {
  const key =
    typeof env.STRIPE_SECRET_KEY === "string"
      ? env.STRIPE_SECRET_KEY.trim()
      : "";

  return key.startsWith("sk_test_");
}

async function createStripeTestCheckout(user, requestedPlan) {
  const secretKey =
    typeof env.STRIPE_SECRET_KEY === "string"
      ? env.STRIPE_SECRET_KEY.trim()
      : "";

  if (!secretKey.startsWith("sk_test_")) {
    return {
      ok: false,
      status: 503,
      error: "Stripe test secret is not configured."
    };
  }

  const priceId = getStripePriceId(requestedPlan);

  if (!priceId) {
    return {
      ok: false,
      status: 503,
      error: "Stripe test price is not configured for this plan."
    };
  }

  const appUrl = getPublicAppUrl();
  const form = new URLSearchParams();

  form.set("mode", "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("client_reference_id", String(user.id));

  if (user.email) {
    form.set("customer_email", user.email);
  }

  form.set(
    "success_url",
    `${appUrl}/?billing=success&session_id={CHECKOUT_SESSION_ID}`
  );

  form.set(
    "cancel_url",
    `${appUrl}/?billing=cancelled`
  );

  form.set("metadata[userId]", String(user.id));
  form.set("metadata[hegevaPlan]", requestedPlan);

  const stripeResponse = await fetch(
    "https://api.stripe.com/v1/checkout/sessions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },

      body: form.toString()
    }
  );

  let stripeData = null;

  try {
    stripeData = await stripeResponse.json();
  } catch {}

  if (!stripeResponse.ok) {
    console.error(
      "HEGEVA Stripe checkout error:",
      stripeData
    );

    return {
      ok: false,
      status: stripeResponse.status || 502,
      error:
        stripeData?.error?.message ||
        "Stripe test checkout could not be created."
    };
  }

  if (!stripeData?.id || !stripeData?.url) {
    return {
      ok: false,
      status: 502,
      error: "Stripe returned an incomplete checkout session."
    };
  }

  return {
    ok: true,
    status: 200,
    id: stripeData.id,
    url: stripeData.url
  };
}

// =========================================
// BILLING STATUS
// =========================================

if (url.pathname === "/api/billing/status") {
  if (request.method !== "GET") {
    return Response.json(
      {
        error: "Method not allowed."
      },
      {
        status: 405
      }
    );
  }

  try {
    const user = await getLoggedInUser(
      request,
      env,
      ctx
    );

    if (!user) {
      return Response.json(
        {
          error: "Authentication required."
        },
        {
          status: 401
        }
      );
    }

    const provider =
      typeof env.PAYMENT_PROVIDER === "string"
        ? env.PAYMENT_PROVIDER.trim().toLowerCase()
        : "";

    const paymentMode =
      typeof env.PAYMENT_MODE === "string"
        ? env.PAYMENT_MODE.trim().toLowerCase()
        : "";

    const providerSelected = provider === "stripe";
    const testMode = paymentMode === "test";
    const secretReady = stripeTestSecretReady();

    const premiumPriceReady =
      Boolean(getStripePriceId("premium"));

    const proPriceReady =
      Boolean(getStripePriceId("pro"));

    const connected =
      providerSelected &&
      testMode &&
      secretReady;

    const checkoutEnabled =
      connected &&
      premiumPriceReady &&
      proPriceReady;

    return Response.json({
      available: true,
      connected,

      provider:
        providerSelected
          ? "Stripe"
          : null,

      mode: "test",

      checkoutEnabled,

      // Deliberately false until the webhook
      // implementation is added and verified.
      webhookVerified: false,

      entitlementSource: "backend",

      cardDataHandledByHegeva: false,
      paymentSecretsExposedToBrowser: false,

      testConfiguration: {
        providerSelected,
        testMode,
        secretReady,
        premiumPriceReady,
        proPriceReady
      },

      message:
        checkoutEnabled
          ? "Stripe test checkout is configured."
          : "Billing API is available, but Stripe test checkout setup is incomplete."
    });
  } catch (error) {
    console.error(
      "HEGEVA billing status error:",
      error
    );

    return Response.json(
      {
        error:
          "Billing status is temporarily unavailable."
      },
      {
        status: 500
      }
    );
  }
}

// =========================================
// STRIPE TEST CHECKOUT
// =========================================

if (url.pathname === "/api/billing/checkout") {
  if (request.method !== "POST") {
    return Response.json(
      {
        error: "Method not allowed."
      },
      {
        status: 405
      }
    );
  }

  try {
    const user = await getLoggedInUser(
      request,
      env,
      ctx
    );

    if (!user) {
      return Response.json(
        {
          error: "Authentication required."
        },
        {
          status: 401
        }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          error: "Invalid JSON body."
        },
        {
          status: 400
        }
      );
    }

    const requestedPlan =
      typeof body?.plan === "string"
        ? body.plan.trim().toLowerCase()
        : "";

    if (
      !["premium", "pro"].includes(
        requestedPlan
      )
    ) {
      return Response.json(
        {
          error: "Invalid paid plan."
        },
        {
          status: 400
        }
      );
    }

    if (body?.mode !== "test") {
      return Response.json(
        {
          error:
            "Only test checkout is allowed in this build."
        },
        {
          status: 400
        }
      );
    }

    const provider =
      typeof env.PAYMENT_PROVIDER === "string"
        ? env.PAYMENT_PROVIDER.trim().toLowerCase()
        : "";

    const paymentMode =
      typeof env.PAYMENT_MODE === "string"
        ? env.PAYMENT_MODE.trim().toLowerCase()
        : "";

    if (
      provider !== "stripe" ||
      paymentMode !== "test"
    ) {
      return Response.json(
        {
          ok: false,
          provider: null,
          mode: "test",
          plan: requestedPlan,
          checkoutReady: false,
          entitlementChanged: false,
          cardDataHandledByHegeva: false,

          message:
            "Stripe test mode is not configured."
        },
        {
          status: 503
        }
      );
    }

    const checkout =
      await createStripeTestCheckout(
        user,
        requestedPlan
      );

    if (!checkout.ok) {
      return Response.json(
        {
          ok: false,
          provider: "Stripe",
          mode: "test",
          plan: requestedPlan,
          checkoutReady: false,
          entitlementChanged: false,
          cardDataHandledByHegeva: false,
          error: checkout.error
        },
        {
          status: checkout.status
        }
      );
    }

    return Response.json({
      ok: true,
      provider: "Stripe",
      mode: "test",
      plan: requestedPlan,
      checkoutReady: true,

      id: checkout.id,
      sessionId: checkout.id,
      url: checkout.url,

      entitlementChanged: false,
      cardDataHandledByHegeva: false,

      message:
        "Stripe test checkout session created. No HEGEVA entitlement has been changed."
    });
  } catch (error) {
    console.error(
      "HEGEVA billing checkout error:",
      error
    );

    return Response.json(
      {
        error:
          "Billing checkout is temporarily unavailable."
      },
      {
        status: 500
      }
    );
  }
}
