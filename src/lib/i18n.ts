export type Locale = "sq" | "en";

export type Role = "employee" | "employer" | "provider";

export type Dict = {
  nav: { login: string; getStarted: string; langLabel: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    badge: string;
    stat1Label: string;
    stat2Label: string;
    stat2Value: string;
  };
  how: { kicker: string; title: string; cards: { tag: string; title: string; body: string }[] };
  features: { kicker: string; title: string; items: { title: string; body: string }[] };
  cta: { title: string; body: string; button: string };
  footer: {
    tagline: string;
    product: string;
    productLinks: string[];
    company: string;
    companyLinks: string[];
    legal: string;
    legalLinks: string[];
    copyright: string;
  };
  pages: {
    auth: { kicker: string; title: string; body: string };
    onboarding: { kicker: string; title: string; body: string };
    employee: { kicker: string; title: string; body: string };
    employer: { kicker: string; title: string; body: string };
    provider: { kicker: string; title: string; body: string };
    placeholderHint: string;
    backHome: string;
  };
  roles: Record<Role, string>;
  demo: { label: string; hint: string };
  categories: Record<string, string>;
  moods: Record<string, string>;
  dashboard: {
    signOut: string;
    employee: {
      pointsBalance: string;
      pointsHint: string;
      yourPicks: string;
      noPicks: string;
      browse: string;
      browseHint: string;
      filterAll: string;
      filterMood: string;
      filterCategory: string;
      price: string;
      pickThis: string;
      added: string;
      status: Record<"pending" | "approved" | "paid" | "rejected", string>;
      tabs: {
        feed: string;
        market: string;
        savings: string;
        mine: string;
        map: string;
        gifts: string;
      };
      gifts: {
        cta: string;
        title: string;
        subtitle: string;
        tabPoints: string;
        tabPackage: string;
        pickColleague: string;
        searchColleague: string;
        noColleagues: string;
        amount: string;
        amountPlaceholder: string;
        balanceLabel: string;
        insufficient: string;
        message: string;
        messagePlaceholder: string;
        send: string;
        sending: string;
        cancel: string;
        successPoints: string;
        successPackage: string;
        sentTitle: string;
        sentEmpty: string;
        receivedTitle: string;
        receivedEmpty: string;
        sentLabel: string;
        receivedLabel: string;
        statusSent: string;
        statusClaimed: string;
        revealKicker: string;
        revealTitle: string;
        revealBody: string;
        revealClaim: string;
        revealClaimed: string;
        pickPackage: string;
        noPackages: string;
        packageTotal: string;
        forColleague: string;
        from: string;
        to: string;
        quickAmounts: string;
      };
      voucher: {
        cta: string;
        title: string;
        kicker: string;
        bundleNote: string;
        valid: string;
        redeemed: string;
        expired: string;
        cancelled: string;
        secureBadge: string;
        valueLabel: string;
        taxFreeLabel: string;
        expiresOn: string;
        redeemedOn: string;
        codeHint: string;
        loadingToken: string;
        rotating: string;
        scanHint: string;
        scanHintRedeemed: string;
        close: string;
        copyCode: string;
        copied: string;
        loadError: string;
        showVoucher: string;
        bundleHeading: string;
        bundleSubheading: string;
      };
      map: {
        title: string;
        hint: string;
        filterAll: string;
        empty: string;
        loading: string;
        fallbackTitle: string;
        fallbackBody: string;
        openInMaps: string;
        directions: string;
        usableHere: string;
        venuesCount: string;
        viewOffers: string;
      };
      welcome: string;
      streak: string;
      streakWeeks: string;
      streakHint: string;
      drops: string;
      dropsHint: string;
      hoursLeft: string;
      forYou: string;
      forYouHint: string;
      add: string;
      bundles: string;
      bundlesHint: string;
      bundleSave: string;
      cartTitle: string;
      cartEmpty: string;
      cartItems: string;
      cartTotal: string;
      submit: string;
      submitting: string;
      submitted: string;
      remove: string;
      savingsTitle: string;
      savingsKicker: string;
      savingsBody: string;
      savingsAsSalary: string;
      savingsAsBenefit: string;
      savingsKeepsMore: string;
      savingsBreakdown: string;
      savingsPit: string;
      savingsSocial: string;
      savingsEffective: string;
      savingsDisclaimer: string;
      myBenefits: string;
      myBenefitsEmpty: string;
      gift: string;
      giftPrompt: string;
      giftSent: string;
      progressLabel: string;
      progressOf: string;
      streakUp: string;
      streakUpBody: string;
      dropEndsIn: string;
      dropEndedJustNow: string;
      challengeTitle: string;
      challengeHint: string;
      challengeProgress: string;
      wrappedCta: string;
      wrappedKicker: string;
      wrappedYourYear: string;
      wrappedPersonaLabel: string;
      wrappedCategoryLabel: string;
      wrappedValueLabel: string;
      wrappedStreakLabel: string;
      wrappedTapNext: string;
      wrappedTapClose: string;
      wrappedClose: string;
      personas: Record<
        "wellness" | "fitness" | "food" | "travel" | "learning" | "telecom" | "health" | "default",
        string
      >;
    };
    employer: {
      company: string;
      employees: string;
      monthlyBudget: string;
      perEmployee: string;
      monthlyPool: string;
      annualBudget: string;
      spentThisCycle: string;
      pending: string;
      pendingCount: string;
      paid: string;
      recentActivity: string;
      topCategories: string;
      noCompany: string;
      employee: string;
      total: string;
      empty: string;
      approvals: string;
      approve: string;
      reject: string;
      routingPayment: string;
      approvedToast: string;
      rejectedToast: string;
      analysis: string;
      mostPopular: string;
      goingUnused: string;
      summaryLabel: string;
      summary: string;
      analysisEmpty: string;
      savingsCalc: string;
      savingsCalcHint: string;
      valuePerEmployee: string;
      asCashRaise: string;
      asBenefit: string;
      youSave: string;
      illustrative: string;
    };
    provider: {
      yourOffers: string;
      noOffers: string;
      recentDemand: string;
      noDemand: string;
      mood: string;
      pickedBy: string;
      revenueThisMonth: string;
      activeRedemptions: string;
      addOffer: string;
      newOffer: string;
      titleSq: string;
      titleEn: string;
      priceL: string;
      categoryLabel: string;
      moodsLabel: string;
      save: string;
      saving: string;
      cancel: string;
      created: string;
      whatPicking: string;
      timesPicked: string;
      whatPickingEmpty: string;
      scan: {
        kicker: string;
        title: string;
        cta: string;
        close: string;
        aim: string;
        manualLabel: string;
        verify: string;
        verifying: string;
        cameraDenied: string;
        valid: string;
        confirmed: string;
        alreadyRedeemed: string;
        redeemedOn: string;
        invalid: string;
        expired: string;
        wrongProvider: string;
        notAProvider: string;
        notFound: string;
        cancelled: string;
        genericError: string;
        scanAnother: string;
        receiptCta: string;
        backToScan: string;
        print: string;
        download: string;
        employee: string;
        offer: string;
        value: string;
        code: string;
        redeemedLog: string;
        redeemedLogEmpty: string;
        when: string;
        receipt: {
          kicker: string;
          title: string;
          employee: string;
          provider: string;
          offer: string;
          code: string;
          value: string;
          taxFree: string;
          confirmedAt: string;
          paidLine: string;
          stamp: string;
        };
      };
    };
  };
  onboarding: {
    saving: string;
    submit: string;
    common: {
      fullName: string;
      fullNamePlaceholder: string;
      fullNameError: string;
    };
    employee: {
      title: string;
      subtitle: string;
      jobTitle: string;
      jobTitlePlaceholder: string;
      department: string;
      departmentOptions: { value: string; label: string }[];
      interests: string;
      interestsHint: string;
      interestsOptions: { value: string; label: string }[];
      jobTitleError: string;
      departmentError: string;
      interestsError: string;
    };
    employer: {
      title: string;
      subtitle: string;
      step1Title: string;
      step2Title: string;
      step3Title: string;
      stepLabel: (n: number, total: number) => string;
      back: string;
      next: string;
      companyName: string;
      companyNamePlaceholder: string;
      industry: string;
      industryOptions: { value: string; label: string }[];
      employeeCount: string;
      employeeCountPlaceholder: string;
      budget: string;
      budgetHint: string;
      budgetSuffix: string;
      brandPrimary: string;
      brandPrimaryHint: string;
      brandSecondary: string;
      brandSecondaryHint: string;
      emailDomains: string;
      emailDomainsHint: string;
      emailDomainsPlaceholder: string;
      pricingTitle: string;
      pricingKicker: string;
      pricingPerEmployee: string;
      pricingPerYear: string;
      pricingFootnote: string;
      pricingHeroPerMonth: string;
      pricingHeroSub: string;
      pricingAnnualLabel: string;
      pricingReassurance: string;
      adminLabel: string;
      welfarePoolTitle: string;
      welfarePoolHint: string;
      payTitle: string;
      paySubtitle: string;
      payCardLabel: string;
      payCardPlaceholder: string;
      payExpLabel: string;
      payCvcLabel: string;
      payUseTestCard: string;
      payButton: (totalL: number) => string;
      payProcessing: string;
      paySkip: string;
      paySuccess: string;
      paySuccessBody: string;
      payGoDashboard: string;
      companyNameError: string;
      industryError: string;
      employeeCountError: string;
      budgetError: string;
    };
    provider: {
      title: string;
      subtitle: string;
      businessName: string;
      businessNamePlaceholder: string;
      contactEmail: string;
      contactEmailPlaceholder: string;
      contactEmailError: string;
      category: string;
      categoryOptions: { value: string; label: string }[];
      city: string;
      cityPlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      tagline: string;
      taglinePlaceholder: string;
      logo: string;
      logoHint: string;
      uploadLogo: string;
      replaceLogo: string;
      removeLogo: string;
      uploadFailed: string;
      freeBadge: string;
      freeRationale: string;
      businessNameError: string;
      categoryError: string;
      cityError: string;
      descriptionError: string;
    };
  };
};

export const dict = {
  sq: {
    nav: { login: "Hyr", getStarted: "Fillo", langLabel: "Gjuha" },
    hero: {
      eyebrow: "Tregu i benefiteve",
      title: "Përfitimet që punonjësit duan vërtet.",
      subtitle: "Tregu i benefiteve i ndërtuar për Shqipërinë, gati për Europën.",
      ctaPrimary: "Fillo falas",
      ctaSecondary: "Shiko si funksionon",
      badge: "I ndërtuar në Tiranë",
      stat1Label: "Mesatare kursimi tatimor",
      stat2Label: "Pa taksa këtë muaj",
      stat2Value: "€86",
    },
    how: {
      kicker: "Si funksionon",
      title: "Tre palë. Një treg i thjeshtë.",
      cards: [
        {
          tag: "Punonjësit",
          title: "Zgjidh atë që do.",
          body: "Shfleto ofertat, përdor pikët dhe shiko kursimet në kohë reale.",
        },
        {
          tag: "Punëdhënësit",
          title: "Financo dhe miraton.",
          body: "Buxhet i qartë, raporte të menjëhershme dhe transparencë tatimore.",
        },
        {
          tag: "Ofruesit",
          title: "Listo ofertat e tua.",
          body: "Arrij kompanitë në mbarë vendin pa komisione absurde.",
        },
      ],
    },
    features: {
      kicker: "Çfarë e bën PERX të ndryshëm",
      title: "Krijuar për njerëzit, ndërtuar për financën.",
      items: [
        { title: "AI Concierge", body: "Rekomandime që mësojnë çfarë i bën punonjësit të lumtur." },
        {
          title: "Transparencë tatimore",
          body: "Shiko saktësisht sa kursen kompania dhe punonjësi për çdo ofertë.",
        },
        {
          title: "Sistemi i pikëve",
          body: "Shpërble besnikërinë me një monedhë të vetme në të gjithë tregun.",
        },
        {
          title: "Paketa të zgjuara",
          body: "Kombinime të personalizuara: ushqim, shëndet, mirëqenie.",
        },
        { title: "Streak & Drops", body: "Oferta të kufizuara që krijojnë moment dhe ngazëllim." },
        {
          title: "Insights për punëdhënësit",
          body: "Kupto çfarë funksionon — pa fletëllogaritëse Excel.",
        },
      ],
    },
    cta: {
      title: "Bëje benefitin diçka që njerëzit e duan.",
      body: "Filloje sot. Pa karta krediti, pa kontrata gjashtëmujore.",
      button: "Krijo një llogari",
    },
    footer: {
      tagline: "Tregu i benefiteve për ekipet moderne.",
      product: "Produkti",
      productLinks: ["Veçoritë", "Çmimet", "Për ofruesit"],
      company: "Kompania",
      companyLinks: ["Rreth nesh", "Karriera", "Kontakt"],
      legal: "Legale",
      legalLinks: ["Privatësia", "Termat", "Cookies"],
      copyright: "© 2026 PERX. Bërë me kujdes në Tiranë.",
    },
    pages: {
      auth: {
        kicker: "Hyrje",
        title: "Mirësevini në PERX.",
        body: "Hyni ose krijoni një llogari për të vazhduar. Po e ndërtojmë këtë hap.",
      },
      onboarding: {
        kicker: "Përshëndetje",
        title: "Le t'ju njohim më mirë.",
        body: "Disa hapa të shpejtë për të personalizuar përvojën tuaj.",
      },
      employee: {
        kicker: "Punonjësi",
        title: "Përfitimet tuaja, në një vend.",
        body: "Këtu do të shfletoni oferta, përdorni pikët dhe shihni kursimet.",
      },
      employer: {
        kicker: "Punëdhënësi",
        title: "Drejtoni programin e benefiteve.",
        body: "Buxhet, miratime, raporte tatimore dhe insights për ekipin.",
      },
      provider: {
        kicker: "Ofruesi",
        title: "Menaxhoni ofertat tuaja.",
        body: "Listoni shërbime, ndiqni performancën dhe arrini ekipet.",
      },
      placeholderHint: "Faqe e ardhshme — po e ndërtojmë në hapat e ardhshëm.",
      backHome: "Kthehu në fillim",
    },
    roles: { employee: "Punonjësi", employer: "Punëdhënësi", provider: "Ofruesi" },
    demo: { label: "Demo", hint: "Ndërro rolin për prezantim" },
    categories: {
      fitness: "Fitnes",
      wellness: "Mirëqenie",
      food: "Ushqim",
      travel: "Udhëtim",
      telecom: "Telekomunikacion",
      health: "Shëndet",
      learning: "Mësim",
      retail: "Tregti",
    },
    moods: {
      relax: "Qetësi",
      energy: "Energji",
      adventure: "Aventurë",
      focus: "Fokus",
    },
    dashboard: {
      signOut: "Dil",
      employee: {
        pointsBalance: "Pikët e tua",
        pointsHint: "1 pikë = 1 Lek për të shpenzuar në treg.",
        yourPicks: "Zgjedhjet e fundit",
        noPicks: "Ende pa zgjedhje. Shfleto tregun më poshtë.",
        browse: "Shfleto tregun",
        browseHint: "Përzgjedhje shqiptare, e përditësuar çdo javë.",
        filterAll: "Të gjitha",
        filterMood: "Disponimi",
        filterCategory: "Kategoria",
        price: "Çmimi",
        pickThis: "Zgjidh këtë",
        added: "U shtua te zgjedhjet.",
        status: {
          pending: "Në pritje",
          approved: "Miratuar",
          paid: "E paguar",
          rejected: "Refuzuar",
        },
        tabs: {
          feed: "Fillimi",
          market: "Tregu",
          savings: "Kursimet",
          mine: "Përfitimet e mia",
          map: "Hartë",
          gifts: "Dhurata",
        },
        gifts: {
          cta: "Dhuro",
          title: "Dhuro një kolegu",
          subtitle: "Ndaj pikët ose dhuro një paketë me një mesazh të shkurtër.",
          tabPoints: "Dërgo pikë",
          tabPackage: "Dhuro paketë",
          pickColleague: "Zgjidh një koleg/e",
          searchColleague: "Kërko sipas emrit ose pozicionit…",
          noColleagues: "Asnjë koleg/e i/e gjetur.",
          amount: "Sasia (pikë)",
          amountPlaceholder: "p.sh. 2000",
          balanceLabel: "Bilanci yt",
          insufficient: "Nuk ke mjaftueshëm pikë.",
          message: "Mesazh (opsional)",
          messagePlaceholder: "Faleminderit për gjithçka",
          send: "Dërgo dhuratën",
          sending: "Po dërgon…",
          cancel: "Anulo",
          successPoints: "Dërgove {n} pikë te {name}",
          successPackage: "Paketa u dhurua te {name}",
          sentTitle: "Dhuratat e dërguara",
          sentEmpty: "Ende pa dhuruar asgjë — fillo me një mesazh të vogël.",
          receivedTitle: "Dhuratat e marra",
          receivedEmpty: "Ende pa marrë dhurata.",
          sentLabel: "Dërguar",
          receivedLabel: "Marrë",
          statusSent: "Dërguar",
          statusClaimed: "E marrë",
          revealKicker: "Surprizë për ty",
          revealTitle: "Ke marrë një dhuratë nga {name}!",
          revealBody: "{detail}",
          revealClaim: "Hape",
          revealClaimed: "U hap!",
          pickPackage: "Zgjidh një paketë",
          noPackages: "Nuk ka paketa të disponueshme.",
          packageTotal: "Totali i paketës",
          forColleague: "për {name}",
          from: "Nga",
          to: "Për",
          quickAmounts: "Shpejt:",
        },
        voucher: {
          cta: "Shfaq biletën",
          title: "Bileta jote",
          kicker: "Pasaportë benefitesh",
          bundleNote: "Një biletë për secilin ofrues — secili e shkrin pjesën e tij.",
          valid: "E vlefshme",
          redeemed: "E përdorur",
          expired: "Skaduar",
          cancelled: "E anuluar",
          secureBadge: "I sigurt · I nënshkruar",
          valueLabel: "Vlera",
          taxFreeLabel: "Vlerë pa taksë",
          expiresOn: "Vlen deri më {date}",
          redeemedOn: "Përdorur më {date}",
          codeHint: "Nëse skanimi nuk funksionon, shkruani kodin:",
          loadingToken: "Po krijohet bileta e sigurt…",
          rotating: "Rifreskim çdo 30s",
          scanHint: "Trego këtë QR te arka — ofruesi e skanon për ta përdorur.",
          scanHintRedeemed: "Kjo biletë është përdorur dhe nuk mund të skanohet sërish.",
          close: "Mbyll",
          copyCode: "Kopjo kodin",
          copied: "U kopjua!",
          loadError: "Bileta nuk mund të ngarkohej. Provo përsëri.",
          showVoucher: "Shfaq biletën",
          bundleHeading: "Biletat e paketës",
          bundleSubheading: "Zgjidh një ofrues për të hapur biletën përkatëse.",
        },
        map: {
          title: "Ku mund t'i përdorësh",
          hint: "Lokacionet e ofertave në Shqipëri",
          filterAll: "Të gjitha",
          empty: "Nuk u gjet asnjë lokacion për këtë filtër.",
          loading: "Po ngarkohet harta…",
          fallbackTitle: "Lista e lokacioneve",
          fallbackBody:
            "Harta nuk mund të ngarkohej. Më poshtë gjen lokacionet me lidhje direkte në Google Maps.",
          openInMaps: "Hap në Google Maps",
          directions: "Merr drejtime",
          usableHere: "Ofertat e disponueshme",
          venuesCount: "{n} lokacione",
          viewOffers: "Shih ofertat",
        },
        welcome: "Mirë se erdhe, {name}",
        streak: "Streak",
        streakWeeks: "{n} javë rresht",
        streakHint: "Vazhdo zgjedhjet javore për të mbajtur streak-un.",
        drops: "Oferta të reja",
        dropsHint: "Të kufizuara në kohë — zgjidhi para se të mbarojnë.",
        hoursLeft: "{n}h të mbetura",
        forYou: "Për ty",
        forYouHint: "Përzgjedhur sipas interesave të tua.",
        add: "Shto",
        bundles: "Paketa inteligjente",
        bundlesHint: "Tre oferta të kombinuara në një tap.",
        bundleSave: "Kurse {n} L",
        cartTitle: "Zgjedhja jote",
        cartEmpty: "Asnjë artikull i shtuar.",
        cartItems: "{n} artikuj",
        cartTotal: "Totali",
        submit: "Dërgo zgjedhjen",
        submitting: "Po dërgojmë…",
        submitted: "Zgjedhja u dërgua për miratim.",
        remove: "Hiq",
        savingsTitle: "Sa kursen vërtet?",
        savingsKicker: "Kursimet",
        savingsBody:
          "Si benefit pa tatim, vlera e plotë mbërrin tek ti. Si pagë, zbritjet të hanë një pjesë të mirë.",
        savingsAsSalary: "Si pagë (neto)",
        savingsAsBenefit: "Si benefit (neto)",
        savingsKeepsMore: "Mban më shumë",
        savingsBreakdown: "Si llogaritet",
        savingsPit: "Tatim mbi të ardhurat (PIT)",
        savingsSocial: "Kontribut social/shëndetësor (9.5%)",
        savingsEffective: "Norma efektive",
        savingsDisclaimer:
          "Llogaritje ilustrative bazuar në fashat aktuale shqiptare. Konsulto financën për shifra zyrtare.",
        myBenefits: "Përfitimet e mia",
        myBenefitsEmpty: "Ende pa përfitime — shfleto tregun.",
        gift: "Dërgo dhuratë një kolegu",
        giftPrompt: "Email-i i kolegut:",
        giftSent: "Dhurata u dërgua. (demo)",
        progressLabel: "Shpenzuar këtë cikël",
        progressOf: "nga",
        streakUp: "Streak +1!",
        streakUpBody: "Po e mban gjallë rutinën — bukur!",
        dropEndsIn: "{t} të mbetura",
        dropEndedJustNow: "Sapo mbaroi",
        challengeTitle: "Sfida javore e ekipit",
        challengeHint: "Bashkë drejt mirëqenies",
        challengeProgress: "{n} nga {goal} zgjedhje këtë javë",
        wrappedCta: "Viti yt me PERX",
        wrappedKicker: "Një moment për ty",
        wrappedYourYear: "Viti yt me PERX",
        wrappedPersonaLabel: "Personaliteti yt",
        wrappedCategoryLabel: "Më e zgjedhura jote",
        wrappedValueLabel: "Vlerë pa tatim",
        wrappedStreakLabel: "Streak më i gjatë",
        wrappedTapNext: "Trokit për të vazhduar",
        wrappedTapClose: "Trokit për të mbyllur",
        wrappedClose: "Mbyll",
        personas: {
          wellness: "Kërkuesi i Mirëqenies",
          fitness: "Atleti i Brendshëm",
          food: "Eksploruesi i Shijes",
          travel: "Endacaku i Lirë",
          learning: "Mendja Kurioze",
          telecom: "Lidhësi Digital",
          health: "Mbrojtësi i Shëndetit",
          default: "Krijuesi i Ritmit",
        },
      },
      employer: {
        company: "Kompania",
        employees: "Punonjës",
        monthlyBudget: "Buxheti mujor",
        perEmployee: "për punonjës",
        monthlyPool: "Fondi i përgjithshëm mujor",
        annualBudget: "Buxheti vjetor",
        spentThisCycle: "Shpenzuar këtë cikël",
        pending: "Në pritje miratimi",
        pendingCount: "Zgjedhje në pritje",
        paid: "Të paguara",
        recentActivity: "Aktiviteti i fundit",
        topCategories: "Kategoritë kryesore",
        noCompany: "Kompania nuk është konfiguruar ende. Plotëso onboarding-un.",
        employee: "Punonjësi",
        total: "Vlera",
        empty: "Asnjë zgjedhje akoma.",
        approvals: "Miratimet",
        approve: "Mirato",
        reject: "Refuzo",
        routingPayment: "Po dërgohet pagesa → {provider}",
        approvedToast: "Përfitimi u konfirmua",
        rejectedToast: "Zgjedhja u refuzua",
        analysis: "Analiza",
        mostPopular: "Më e zgjedhura",
        goingUnused: "Pa zgjedhje",
        summaryLabel: "Përmbledhje",
        summary:
          "Ekipi yt po zgjedh më shumë {top}. Kategoritë {unused} po shkojnë pa përdorim — mund të vlejnë komunikim shtesë.",
        analysisEmpty: "Pa të dhëna të mjaftueshme akoma.",
        savingsCalc: "Llogaritësi i kursimeve",
        savingsCalcHint: "Sa kurseni krahasuar me një rritje pagash ekuivalente.",
        valuePerEmployee: "Vlera për punonjës",
        asCashRaise: "Si rritje pagash (kosto)",
        asBenefit: "Si benefit (kosto)",
        youSave: "Kurseni",
        illustrative: "Ilustrative — kontribute punëdhënësi rreth 16.5%.",
      },
      provider: {
        yourOffers: "Ofertat e tua",
        noOffers: "Ende pa oferta. Krijo një ofertë për të nisur.",
        recentDemand: "Kërkesa e fundit",
        noDemand: "Ende pa zgjedhje për ofertat e tua.",
        mood: "Disponimi",
        pickedBy: "Zgjedhur nga",
        revenueThisMonth: "Të ardhura këtë muaj",
        activeRedemptions: "Konfirmime aktive",
        addOffer: "Shto ofertë të re",
        newOffer: "Ofertë e re",
        titleSq: "Titulli (shqip)",
        titleEn: "Titulli (anglisht)",
        priceL: "Çmimi (Lek)",
        categoryLabel: "Kategoria",
        moodsLabel: "Disponimet",
        save: "Ruaj",
        saving: "Po ruajmë…",
        cancel: "Anulo",
        created: "Oferta u krijua.",
        whatPicking: "Çfarë po zgjedhin punonjësit",
        timesPicked: "{n} zgjedhje",
        whatPickingEmpty: "Ende pa zgjedhje për të analizuar.",
        scan: {
          kicker: "Verifikim",
          title: "Skano biletën",
          cta: "Skano biletën",
          close: "Mbyll",
          aim: "Drejto kamerën te kodi QR i biletës.",
          manualLabel: "Ose shkruaj kodin manualisht",
          verify: "Verifiko",
          verifying: "Po verifikojmë…",
          cameraDenied: "Kamera nuk është e disponueshme. Përdor kodin manual më poshtë.",
          valid: "✓ E vlefshme",
          confirmed: "Përfitimi u konfirmua",
          alreadyRedeemed: "✗ Kjo biletë është përdorur",
          redeemedOn: "U përdor më {date}",
          invalid: "✗ Biletë e pavlefshme",
          expired: "✗ Biletë e skaduar",
          wrongProvider: "✗ Kjo biletë nuk i përket biznesit tuaj",
          notAProvider: "Llogaria juaj nuk është e regjistruar si ofrues.",
          notFound: "✗ Bileta nuk u gjet",
          cancelled: "✗ Bileta është anuluar",
          genericError: "Diçka shkoi keq. Provo përsëri.",
          scanAnother: "Skano një tjetër",
          receiptCta: "Shkarko/Printo faturën",
          backToScan: "Kthehu te skanimi",
          print: "Printo",
          download: "Shkarko PDF",
          employee: "Punonjësi",
          offer: "Oferta",
          value: "Vlera",
          code: "Kodi",
          redeemedLog: "Biletat e përdorura",
          redeemedLogEmpty: "Ende pa bileta të përdorura.",
          when: "Kur",
          receipt: {
            kicker: "Faturë PERX",
            title: "Faturë përfitimi",
            employee: "Punonjësi",
            provider: "Ofruesi",
            offer: "Oferta",
            code: "Kodi",
            value: "Vlera",
            taxFree: "Pa tatim",
            confirmedAt: "Konfirmuar më",
            paidLine: "I paguar përmes PERX — punonjësi nuk pagoi cash.",
            stamp: "Konfirmuar",
          },
        },
      },
    },
    onboarding: {
      saving: "Po ruajmë…",
      submit: "Vazhdo te paneli",
      common: {
        fullName: "Emri i plotë",
        fullNamePlaceholder: "Si të të thërrasim?",
        fullNameError: "Shkruaj emrin tënd të plotë",
      },
      employee: {
        title: "Disa fjalë për ty.",
        subtitle: "Do t'i përdorim për të personalizuar ofertat dhe AI Concierge.",
        jobTitle: "Pozicioni",
        jobTitlePlaceholder: "p.sh. Product Designer",
        department: "Departamenti",
        departmentOptions: [
          { value: "engineering", label: "Inxhinieri" },
          { value: "design", label: "Dizajn" },
          { value: "marketing", label: "Marketing" },
          { value: "sales", label: "Shitje" },
          { value: "operations", label: "Operacione" },
          { value: "other", label: "Tjetër" },
        ],
        interests: "Çfarë të bën të lumtur?",
        interestsHint: "Zgjidh sa të duash — i ndryshojmë kurdo më vonë.",
        interestsOptions: [
          { value: "fitness", label: "Fitness" },
          { value: "wellness", label: "Mirëqenie" },
          { value: "travel", label: "Udhëtim" },
          { value: "food", label: "Ushqim" },
          { value: "health", label: "Shëndet" },
          { value: "learning", label: "Mësim" },
          { value: "telecom", label: "Telekomunikacion" },
        ],
        jobTitleError: "Shkruaj pozicionin tënd",
        departmentError: "Zgjidh një departament",
        interestsError: "Zgjidh të paktën një interes",
      },
      employer: {
        title: "Le të njohim kompaninë tuaj.",
        subtitle: "Dy hapa të shkurtër — dhe pastaj jemi gati.",
        step1Title: "Detajet e kompanisë",
        step2Title: "Plani dhe buxheti",
        step3Title: "Pagesa vjetore",
        stepLabel: (n, total) => `Hapi ${n} nga ${total}`,
        back: "Kthehu",
        next: "Vazhdo",
        companyName: "Emri i kompanisë",
        companyNamePlaceholder: "p.sh. Studio Alba",
        industry: "Industria",
        industryOptions: [
          { value: "technology", label: "Teknologji" },
          { value: "finance", label: "Financë" },
          { value: "retail", label: "Tregti" },
          { value: "hospitality", label: "Hoteleri & Turizëm" },
          { value: "healthcare", label: "Shëndetësi" },
          { value: "education", label: "Arsim" },
          { value: "manufacturing", label: "Prodhim" },
          { value: "services", label: "Shërbime" },
          { value: "other", label: "Tjetër" },
        ],
        employeeCount: "Sa punonjës ka kompania?",
        employeeCountPlaceholder: "p.sh. 24",
        budget: "Buxheti mujor për punonjës",
        budgetHint: "Krediti që çdo punonjës do të shpenzojë në treg, çdo muaj.",
        budgetSuffix: "Lekë",
        brandPrimary: "Ngjyra kryesore e markës",
        brandPrimaryHint: "Paneli juaj do të marrë këtë ngjyrë. Mund ta ndryshoni më vonë.",
        brandSecondary: "Ngjyra dytësore (opsionale)",
        brandSecondaryHint: "Përdoret për theks në detaje të vogla.",
        emailDomains: "Domain-et e email-it të punonjësve (opsionale)",
        emailDomainsHint:
          "Për referencë — domain-et e email-it të punonjësve tuaj. Nuk përdoret për të kufizuar regjistrimin.",
        emailDomainsPlaceholder: "@digitalnova.al, @studioalba.al",
        pricingTitle: "Licenca vjetore PERX",
        pricingKicker: "Tarifa e platformës",
        pricingPerEmployee: "për punonjës / vit",
        pricingPerYear: "/vit",
        pricingFootnote: "≈ €3 për punonjës / muaj — i ndarë nga buxheti i benefiteve.",
        pricingHeroPerMonth: "€3 / punonjës / muaj",
        pricingHeroSub: "≈ 300 L për punonjës / muaj",
        pricingAnnualLabel: "Totali vjetor",
        pricingReassurance:
          "Tarifa e platformës — e ndarë nga buxheti i benefiteve që u jepni punonjësve.",
        adminLabel: "Administratori",
        welfarePoolTitle: "Buxheti vjetor i benefiteve",
        welfarePoolHint:
          "Krediti që ju u jepni punonjësve për të shpenzuar në treg. Ky shkon te ekipi juaj.",
        payTitle: "Konfirmoni pagesën",
        paySubtitle: "Simulim — asnjë kartë reale nuk do të faturohet.",
        payCardLabel: "Numri i kartës",
        payCardPlaceholder: "4242 4242 4242 4242",
        payExpLabel: "Skadimi",
        payCvcLabel: "CVC",
        payUseTestCard: "Përdor kartën e testit",
        payButton: (totalL) =>
          `Paguaj ${Math.round(totalL)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} L / vit`,
        payProcessing: "Po përpunohet…",
        paySkip: "Kalo tani (demo)",
        paySuccess: "Pagesa u konfirmua",
        paySuccessBody: "Licenca juaj vjetore është aktive. Mirësevini në PERX.",
        payGoDashboard: "Hap panelin tim",
        companyNameError: "Shkruaj emrin e kompanisë",
        industryError: "Zgjidh një industri",
        employeeCountError: "Shkruaj një numër të vlefshëm punonjësish",
        budgetError: "Shkruaj një buxhet të vlefshëm",
      },
      provider: {
        title: "Listo biznesin tuaj në PERX.",
        subtitle: "Pak detaje dhe jeni gati. Ofertat tuaja shfaqen për ekipet sapo t'i shtoni.",
        businessName: "Emri i biznesit",
        businessNamePlaceholder: "p.sh. Klubi Sportiv Drini",
        contactEmail: "Email kontakti",
        contactEmailPlaceholder: "kontakt@biznesi-juaj.al",
        contactEmailError: "Shkruaj një email të vlefshëm",
        category: "Kategoria",
        categoryOptions: [
          { value: "fitness", label: "Fitness" },
          { value: "wellness", label: "Mirëqenie" },
          { value: "travel", label: "Udhëtim" },
          { value: "food", label: "Ushqim" },
          { value: "health", label: "Shëndet" },
          { value: "learning", label: "Mësim" },
          { value: "telecom", label: "Telekomunikacion" },
        ],
        city: "Qyteti",
        cityPlaceholder: "p.sh. Tiranë",
        description: "Përshkrim i shkurtër",
        descriptionPlaceholder: "Çfarë ofron biznesi yt në një fjali të shkurtër?",
        tagline: "Slogan i shkurtër (opsional)",
        taglinePlaceholder: "Një rresht që përshkruan biznesin tuaj",
        logo: "Logoja",
        logoHint: "PNG ose JPG, deri 2 MB. Nëse e kaloni, shfaqim një monogram të pastër.",
        uploadLogo: "Ngarko logon",
        replaceLogo: "Ndrysho logon",
        removeLogo: "Hiq",
        uploadFailed: "Ngarkimi dështoi. Provoni përsëri.",
        freeBadge: "Falas për bizneset që ofrojnë shërbime",
        freeRationale:
          "PERX është falas për ofruesit — platforma financohet nga abonimet e punëdhënësve.",
        businessNameError: "Shkruaj emrin e biznesit",
        categoryError: "Zgjidh një kategori",
        cityError: "Shkruaj qytetin",
        descriptionError: "Shto një përshkrim të shkurtër (10+ shkronja)",
      },
    },
  },
  en: {
    nav: { login: "Log in", getStarted: "Get started", langLabel: "Language" },
    hero: {
      eyebrow: "Employee benefits marketplace",
      title: "Benefits employees actually want.",
      subtitle: "The benefits marketplace built for Albania, ready for Europe.",
      ctaPrimary: "Start for free",
      ctaSecondary: "See how it works",
      badge: "Built in Tirana",
      stat1Label: "Average tax savings",
      stat2Label: "Tax-free this month",
      stat2Value: "€86",
    },
    how: {
      kicker: "How it works",
      title: "Three sides. One simple market.",
      cards: [
        {
          tag: "Employees",
          title: "Pick what you love.",
          body: "Browse offers, spend points and see your savings in real time.",
        },
        {
          tag: "Employers",
          title: "Fund and approve.",
          body: "Clear budgets, instant reports and full tax transparency.",
        },
        {
          tag: "Providers",
          title: "List your offers.",
          body: "Reach companies nationwide without absurd commissions.",
        },
      ],
    },
    features: {
      kicker: "What makes PERX different",
      title: "Designed for people, engineered for finance.",
      items: [
        { title: "AI Concierge", body: "Recommendations that learn what makes your team happy." },
        {
          title: "Tax transparency",
          body: "See exactly what your company and employees save on every offer.",
        },
        {
          title: "Points reward system",
          body: "Reward loyalty with a single currency across the marketplace.",
        },
        { title: "Smart bundles", body: "Curated combos across food, health and wellbeing." },
        {
          title: "Streaks & drops",
          body: "Limited offers that create moments your team talks about.",
        },
        { title: "Employer insights", body: "Understand what works — no spreadsheets required." },
      ],
    },
    cta: {
      title: "Make benefits something people love.",
      body: "Start today. No credit cards, no six-month contracts.",
      button: "Create an account",
    },
    footer: {
      tagline: "The benefits marketplace for modern teams.",
      product: "Product",
      productLinks: ["Features", "Pricing", "For providers"],
      company: "Company",
      companyLinks: ["About", "Careers", "Contact"],
      legal: "Legal",
      legalLinks: ["Privacy", "Terms", "Cookies"],
      copyright: "© 2026 PERX. Crafted in Tirana.",
    },
    pages: {
      auth: {
        kicker: "Sign in",
        title: "Welcome to PERX.",
        body: "Log in or create an account to continue. This screen is on the way.",
      },
      onboarding: {
        kicker: "Hello",
        title: "Let's get to know you.",
        body: "A few quick steps to tailor your experience.",
      },
      employee: {
        kicker: "Employee",
        title: "Your benefits, in one place.",
        body: "Browse offers, spend points and watch your savings stack up.",
      },
      employer: {
        kicker: "Employer",
        title: "Run your benefits programme.",
        body: "Budgets, approvals, tax reports and team insights.",
      },
      provider: {
        kicker: "Provider",
        title: "Manage your offers.",
        body: "List services, track performance and reach modern teams.",
      },
      placeholderHint: "Coming soon — we're building this in the next steps.",
      backHome: "Back to home",
    },
    roles: { employee: "Employee", employer: "Employer", provider: "Provider" },
    demo: { label: "Demo", hint: "Switch role for the pitch" },
    categories: {
      fitness: "Fitness",
      wellness: "Wellness",
      food: "Food",
      travel: "Travel",
      telecom: "Telecom",
      health: "Health",
      learning: "Learning",
      retail: "Retail",
    },
    moods: {
      relax: "Relax",
      energy: "Energy",
      adventure: "Adventure",
      focus: "Focus",
    },
    dashboard: {
      signOut: "Sign out",
      employee: {
        pointsBalance: "Your points",
        pointsHint: "1 point = 1 Lek to spend in the marketplace.",
        yourPicks: "Recent picks",
        noPicks: "No picks yet. Browse the marketplace below.",
        browse: "Browse the marketplace",
        browseHint: "Hand-picked Albanian providers, refreshed weekly.",
        filterAll: "All",
        filterMood: "Mood",
        filterCategory: "Category",
        price: "Price",
        pickThis: "Pick this",
        added: "Added to your picks.",
        status: { pending: "Pending", approved: "Approved", paid: "Paid", rejected: "Rejected" },
        tabs: {
          feed: "Feed",
          market: "Marketplace",
          savings: "Savings",
          mine: "My benefits",
          map: "Map",
          gifts: "Gifts",
        },
        gifts: {
          cta: "Gift",
          title: "Gift a colleague",
          subtitle: "Share points or gift a package with a short message.",
          tabPoints: "Send points",
          tabPackage: "Gift a package",
          pickColleague: "Pick a colleague",
          searchColleague: "Search by name or job title…",
          noColleagues: "No colleagues found.",
          amount: "Amount (points)",
          amountPlaceholder: "e.g. 2000",
          balanceLabel: "Your balance",
          insufficient: "You don't have enough points.",
          message: "Message (optional)",
          messagePlaceholder: "Thanks for everything",
          send: "Send gift",
          sending: "Sending…",
          cancel: "Cancel",
          successPoints: "Sent {n} points to {name}",
          successPackage: "Package gifted to {name}",
          sentTitle: "Gifts sent",
          sentEmpty: "Nothing sent yet — start with a small note.",
          receivedTitle: "Gifts received",
          receivedEmpty: "No gifts yet.",
          sentLabel: "Sent",
          receivedLabel: "Received",
          statusSent: "Sent",
          statusClaimed: "Opened",
          revealKicker: "A surprise for you",
          revealTitle: "You got a gift from {name}!",
          revealBody: "{detail}",
          revealClaim: "Open it",
          revealClaimed: "Opened!",
          pickPackage: "Pick a package",
          noPackages: "No packages available.",
          packageTotal: "Package total",
          forColleague: "for {name}",
          from: "From",
          to: "To",
          quickAmounts: "Quick:",
        },
        voucher: {
          cta: "Show voucher",
          title: "Your voucher",
          kicker: "Benefits pass",
          bundleNote: "One voucher per provider — each one redeems their own part.",
          valid: "Valid",
          redeemed: "Redeemed",
          expired: "Expired",
          cancelled: "Cancelled",
          secureBadge: "Secure · Signed",
          valueLabel: "Value",
          taxFreeLabel: "Tax-free value",
          expiresOn: "Valid until {date}",
          redeemedOn: "Redeemed on {date}",
          codeHint: "If scanning fails, type this code:",
          loadingToken: "Generating secure voucher…",
          rotating: "Refreshing every 30s",
          scanHint: "Show this QR at the counter — the provider scans to redeem.",
          scanHintRedeemed: "This voucher has been used and cannot be scanned again.",
          close: "Close",
          copyCode: "Copy code",
          copied: "Copied!",
          loadError: "Could not load voucher. Please try again.",
          showVoucher: "Show voucher",
          bundleHeading: "Bundle vouchers",
          bundleSubheading: "Pick a provider to open the matching voucher.",
        },
        map: {
          title: "Where you can use them",
          hint: "Offer locations across Albania",
          filterAll: "All",
          empty: "No locations found for this filter.",
          loading: "Loading map…",
          fallbackTitle: "Locations list",
          fallbackBody:
            "The map couldn't load. Here are the locations with direct Google Maps links.",
          openInMaps: "Open in Google Maps",
          directions: "Get directions",
          usableHere: "Available offers",
          venuesCount: "{n} venues",
          viewOffers: "View offers",
        },
        welcome: "Welcome back, {name}",
        streak: "Streak",
        streakWeeks: "{n} weeks in a row",
        streakHint: "Keep picking weekly to grow your streak.",
        drops: "New drops",
        dropsHint: "Limited time — grab them before they're gone.",
        hoursLeft: "{n}h left",
        forYou: "For you",
        forYouHint: "Picked from the interests you shared.",
        add: "Add",
        bundles: "Smart bundles",
        bundlesHint: "Three offers, one tap.",
        bundleSave: "Save {n} L",
        cartTitle: "Your selection",
        cartEmpty: "Nothing added yet.",
        cartItems: "{n} items",
        cartTotal: "Total",
        submit: "Submit selection",
        submitting: "Submitting…",
        submitted: "Selection sent for approval.",
        remove: "Remove",
        savingsTitle: "How much do you really keep?",
        savingsKicker: "Savings",
        savingsBody:
          "Delivered as a tax-free benefit, the full value reaches you. As a raise, deductions take a real bite.",
        savingsAsSalary: "As salary (net)",
        savingsAsBenefit: "As benefit (net)",
        savingsKeepsMore: "You keep more",
        savingsBreakdown: "How we calculate",
        savingsPit: "Personal income tax (PIT)",
        savingsSocial: "Social/health contribution (9.5%)",
        savingsEffective: "Effective rate",
        savingsDisclaimer:
          "Illustrative model based on current Albanian brackets. Confirm with your finance team for official figures.",
        myBenefits: "My benefits",
        myBenefitsEmpty: "No benefits yet — browse the marketplace.",
        gift: "Gift to a colleague",
        giftPrompt: "Colleague email:",
        giftSent: "Gift sent. (demo)",
        progressLabel: "Spent this cycle",
        progressOf: "of",
        streakUp: "Streak +1!",
        streakUpBody: "You kept the rhythm going — nice.",
        dropEndsIn: "{t} left",
        dropEndedJustNow: "Just ended",
        challengeTitle: "Weekly team challenge",
        challengeHint: "Together toward wellbeing",
        challengeProgress: "{n} of {goal} picks this week",
        wrappedCta: "Your year with PERX",
        wrappedKicker: "A moment for you",
        wrappedYourYear: "Your year with PERX",
        wrappedPersonaLabel: "Your persona",
        wrappedCategoryLabel: "Your top pick",
        wrappedValueLabel: "Tax-free value",
        wrappedStreakLabel: "Longest streak",
        wrappedTapNext: "Tap to continue",
        wrappedTapClose: "Tap to close",
        wrappedClose: "Close",
        personas: {
          wellness: "The Wellness Seeker",
          fitness: "The Inner Athlete",
          food: "The Flavor Explorer",
          travel: "The Free Wanderer",
          learning: "The Curious Mind",
          telecom: "The Digital Connector",
          health: "The Health Guardian",
          default: "The Rhythm Maker",
        },
      },
      employer: {
        company: "Company",
        employees: "Employees",
        monthlyBudget: "Monthly budget",
        perEmployee: "per employee",
        monthlyPool: "Total monthly pool",
        annualBudget: "Annual budget",
        spentThisCycle: "Spent this cycle",
        pending: "Pending approval",
        pendingCount: "Pending selections",
        paid: "Paid",
        recentActivity: "Recent activity",
        topCategories: "Top categories",
        noCompany: "Company isn't set up yet. Finish onboarding first.",
        employee: "Employee",
        total: "Total",
        empty: "No selections yet.",
        approvals: "Approvals",
        approve: "Approve",
        reject: "Reject",
        routingPayment: "Routing payment → {provider}",
        approvedToast: "Benefit confirmed",
        rejectedToast: "Selection rejected",
        analysis: "Insights",
        mostPopular: "Most popular",
        goingUnused: "Going unused",
        summaryLabel: "Summary",
        summary:
          "Your team is gravitating toward {top}. Categories {unused} are going unused — they may need a nudge.",
        analysisEmpty: "Not enough data yet.",
        savingsCalc: "Employer savings calculator",
        savingsCalcHint: "Compare benefit cost vs. equivalent cash raise.",
        valuePerEmployee: "Value per employee",
        asCashRaise: "As cash raise (cost)",
        asBenefit: "As benefit (cost)",
        youSave: "You save",
        illustrative: "Illustrative — employer-side contributions about 16.5%.",
      },
      provider: {
        yourOffers: "Your offers",
        noOffers: "No offers yet. Create one to start.",
        recentDemand: "Recent demand",
        noDemand: "No selections for your offers yet.",
        mood: "Mood",
        pickedBy: "Picked by",
        revenueThisMonth: "Revenue this month",
        activeRedemptions: "Active redemptions",
        addOffer: "Add new offer",
        newOffer: "New offer",
        titleSq: "Title (Albanian)",
        titleEn: "Title (English)",
        priceL: "Price (Lek)",
        categoryLabel: "Category",
        moodsLabel: "Moods",
        save: "Save",
        saving: "Saving…",
        cancel: "Cancel",
        created: "Offer created.",
        whatPicking: "What employees are picking",
        timesPicked: "{n} picks",
        whatPickingEmpty: "No picks to analyze yet.",
        scan: {
          kicker: "Verification",
          title: "Scan voucher",
          cta: "Scan voucher",
          close: "Close",
          aim: "Point your camera at the voucher's QR code.",
          manualLabel: "Or enter the code manually",
          verify: "Verify",
          verifying: "Verifying…",
          cameraDenied: "Camera unavailable. Use the manual code below.",
          valid: "✓ Valid",
          confirmed: "Benefit confirmed",
          alreadyRedeemed: "✗ This voucher has been used",
          redeemedOn: "Redeemed on {date}",
          invalid: "✗ Invalid voucher",
          expired: "✗ Expired voucher",
          wrongProvider: "✗ This voucher isn't for your business",
          notAProvider: "Your account isn't registered as a provider.",
          notFound: "✗ Voucher not found",
          cancelled: "✗ Voucher was cancelled",
          genericError: "Something went wrong. Try again.",
          scanAnother: "Scan another",
          receiptCta: "Download/Print receipt",
          backToScan: "Back to scan",
          print: "Print",
          download: "Download PDF",
          employee: "Employee",
          offer: "Offer",
          value: "Value",
          code: "Code",
          redeemedLog: "Redeemed vouchers",
          redeemedLogEmpty: "No redeemed vouchers yet.",
          when: "When",
          receipt: {
            kicker: "PERX receipt",
            title: "Benefit receipt",
            employee: "Employee",
            provider: "Provider",
            offer: "Offer",
            code: "Code",
            value: "Value",
            taxFree: "Tax-free",
            confirmedAt: "Confirmed on",
            paidLine: "Paid via PERX — employee paid no cash.",
            stamp: "Confirmed",
          },
        },
      },
    },
    onboarding: {
      saving: "Saving…",
      submit: "Continue to dashboard",
      common: {
        fullName: "Full name",
        fullNamePlaceholder: "What should we call you?",
        fullNameError: "Tell us your full name",
      },
      employee: {
        title: "A little about you.",
        subtitle: "We use this to personalize offers and the AI concierge.",
        jobTitle: "Job title",
        jobTitlePlaceholder: "e.g. Product Designer",
        department: "Department",
        departmentOptions: [
          { value: "engineering", label: "Engineering" },
          { value: "design", label: "Design" },
          { value: "marketing", label: "Marketing" },
          { value: "sales", label: "Sales" },
          { value: "operations", label: "Operations" },
          { value: "other", label: "Other" },
        ],
        interests: "What do you enjoy?",
        interestsHint: "Pick as many as you like — change them anytime.",
        interestsOptions: [
          { value: "fitness", label: "Fitness" },
          { value: "wellness", label: "Wellness" },
          { value: "travel", label: "Travel" },
          { value: "food", label: "Food" },
          { value: "health", label: "Health" },
          { value: "learning", label: "Learning" },
          { value: "telecom", label: "Telecom" },
        ],
        jobTitleError: "Add your job title",
        departmentError: "Pick a department",
        interestsError: "Pick at least one interest",
      },
      employer: {
        title: "Tell us about your company.",
        subtitle: "Two short steps — and you're in.",
        step1Title: "Company details",
        step2Title: "Plan & budget",
        step3Title: "Yearly payment",
        stepLabel: (n, total) => `Step ${n} of ${total}`,
        back: "Back",
        next: "Continue",
        companyName: "Company name",
        companyNamePlaceholder: "e.g. Studio Alba",
        industry: "Industry",
        industryOptions: [
          { value: "technology", label: "Technology" },
          { value: "finance", label: "Finance" },
          { value: "retail", label: "Retail" },
          { value: "hospitality", label: "Hospitality & Travel" },
          { value: "healthcare", label: "Healthcare" },
          { value: "education", label: "Education" },
          { value: "manufacturing", label: "Manufacturing" },
          { value: "services", label: "Services" },
          { value: "other", label: "Other" },
        ],
        employeeCount: "How many people work there?",
        employeeCountPlaceholder: "e.g. 24",
        budget: "Monthly budget per employee",
        budgetHint: "The credit each employee gets to spend in the marketplace each month.",
        budgetSuffix: "Lek",
        brandPrimary: "Primary brand color",
        brandPrimaryHint: "Your dashboard will pick this up. You can change it later.",
        brandSecondary: "Secondary color (optional)",
        brandSecondaryHint: "Used as a subtle accent.",
        emailDomains: "Employee email domains (optional)",
        emailDomainsHint: "For reference — your employees' email domains. Not used to gate signup.",
        emailDomainsPlaceholder: "@digitalnova.al, @studioalba.al",
        pricingTitle: "PERX yearly licence",
        pricingKicker: "Platform fee",
        pricingPerEmployee: "per employee / year",
        pricingPerYear: "/yr",
        pricingFootnote: "≈ €3 per employee / month — separate from your benefits budget.",
        pricingHeroPerMonth: "€3 / employee / month",
        pricingHeroSub: "≈ 300 L per employee / month",
        pricingAnnualLabel: "Annual total",
        pricingReassurance: "Platform fee — separate from the benefits budget you give your staff.",
        adminLabel: "Admin",
        welfarePoolTitle: "Yearly benefits budget",
        welfarePoolHint:
          "The credit you give employees to spend in the marketplace. This goes to your team.",
        payTitle: "Confirm payment",
        paySubtitle: "Simulated — no real card will be charged.",
        payCardLabel: "Card number",
        payCardPlaceholder: "4242 4242 4242 4242",
        payExpLabel: "Expiry",
        payCvcLabel: "CVC",
        payUseTestCard: "Use test card",
        payButton: (totalL) =>
          `Pay ${Math.round(totalL)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} L / year`,
        payProcessing: "Processing…",
        paySkip: "Skip for now (demo)",
        paySuccess: "Payment confirmed",
        paySuccessBody: "Your yearly licence is active. Welcome to PERX.",
        payGoDashboard: "Open my dashboard",
        companyNameError: "Add your company name",
        industryError: "Pick an industry",
        employeeCountError: "Enter a valid employee count",
        budgetError: "Enter a valid budget",
      },
      provider: {
        title: "List your business on PERX.",
        subtitle:
          "A few details and you're live. Your offers appear to teams as soon as you add them.",
        businessName: "Business name",
        businessNamePlaceholder: "e.g. Drini Sports Club",
        contactEmail: "Contact email",
        contactEmailPlaceholder: "hello@your-business.com",
        contactEmailError: "Enter a valid email",
        category: "Category",
        categoryOptions: [
          { value: "fitness", label: "Fitness" },
          { value: "wellness", label: "Wellness" },
          { value: "travel", label: "Travel" },
          { value: "food", label: "Food" },
          { value: "health", label: "Health" },
          { value: "learning", label: "Learning" },
          { value: "telecom", label: "Telecom" },
        ],
        city: "City",
        cityPlaceholder: "e.g. Tirana",
        description: "Short description",
        descriptionPlaceholder: "What does your business offer, in a sentence?",
        tagline: "Short tagline (optional)",
        taglinePlaceholder: "One line about your business",
        logo: "Logo",
        logoHint: "PNG or JPG, up to 2 MB. If skipped, we show a clean monogram.",
        uploadLogo: "Upload logo",
        replaceLogo: "Replace logo",
        removeLogo: "Remove",
        uploadFailed: "Upload failed. Please try again.",
        freeBadge: "Free for service providers",
        freeRationale:
          "PERX is free for providers — the platform is funded by employer subscriptions.",
        businessNameError: "Add your business name",
        categoryError: "Pick a category",
        cityError: "Add a city",
        descriptionError: "Write a short description (10+ characters)",
      },
    },
  },
} satisfies Record<Locale, Dict>;
