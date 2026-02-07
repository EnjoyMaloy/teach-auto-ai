import { Check, X, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import { useSidebar } from "@/components/ui/sidebar";

const plans = [
  {
    title: "Стартовый",
    description: "Для знакомства с платформой",
    price: { monthly: "Бесплатно", annually: "Бесплатно" },
    recommended: false,
    current: false,
    icon: null,
    featureGroups: [
      {
        title: "Возможности",
        features: [
          { title: "3 курса", icon: Check },
          { title: "Базовые шаблоны", icon: Check },
          { title: "AI-генерация", icon: X },
          { title: "Аналитика", icon: X },
        ],
      },
    ],
  },
  {
    title: "Pro",
    description: "Для профессионалов",
    price: {
      monthly: "₽2 490",
      annually: (
        <span className="flex items-center">
          ₽1 990<Badge className="ml-2">-20%</Badge>
        </span>
      ),
    },
    recommended: true,
    current: true,
    icon: Zap,
    featureGroups: [
      {
        title: "Возможности",
        features: [
          { title: "Безлимитные курсы", icon: Check },
          { title: "Все шаблоны", icon: Check },
          { title: "Безлимитная AI-генерация", icon: Check },
          { title: "Расширенная аналитика", icon: Check },
          { title: "Приоритетная поддержка", icon: Check },
        ],
      },
    ],
  },
  {
    title: "Команда",
    description: "Для организаций",
    price: {
      monthly: "₽9 990",
      annually: (
        <span className="flex items-center">
          ₽7 990<Badge className="ml-2">-20%</Badge>
        </span>
      ),
    },
    recommended: false,
    current: false,
    icon: null,
    featureGroups: [
      {
        title: "Возможности",
        features: [
          { title: "Всё из Pro", icon: Check },
          { title: "До 10 участников", icon: Check },
          { title: "Брендирование", icon: Check },
          { title: "API доступ", icon: Check },
          { title: "Персональный менеджер", icon: Check },
        ],
      },
    ],
  },
];

const Pricing = () => {
  const [annualBilling, setAnnualBilling] = useState(true);
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <div className="absolute inset-0 bg-[#0a0a0b] overflow-auto">
      <AnimatedBackground />
      
      {/* Content with sidebar offset */}
      <div 
        className="relative z-10 py-12 pb-20 md:py-20 md:pb-24 transition-all duration-300"
        style={{
          paddingLeft: isExpanded ? 'var(--sidebar-width)' : '0px',
        }}
      >
        <div className="container max-w-5xl mx-auto px-6">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl xl:text-5xl">
              Тарифы и цены
            </h1>
            <p className="text-white/50 lg:text-lg">
              Выберите план, который подходит именно вам
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="mb-12 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-white/5 border border-white/10 p-1.5 px-4">
              <span className={cn(
                "text-sm font-medium transition-colors",
                !annualBilling ? "text-white" : "text-white/40"
              )}>
                Ежемесячно
              </span>
              <Switch
                id="annual-billing"
                checked={annualBilling}
                onCheckedChange={setAnnualBilling}
              />
              <span className={cn(
                "text-sm font-medium transition-colors",
                annualBilling ? "text-white" : "text-white/40"
              )}>
                Ежегодно
              </span>
            </div>
          </div>

          {/* Plans Grid - 3 columns */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => (
              <article
                key={plan.title}
                className={cn(
                  "relative rounded-2xl border overflow-hidden transition-all",
                  plan.recommended 
                    ? "border-primary bg-white/[0.03] shadow-2xl shadow-primary/20 md:scale-105 z-10" 
                    : "border-white/10 bg-white/[0.02] hover:border-white/20",
                  index === 0 && "md:-mr-2",
                  index === 2 && "md:-ml-2"
                )}
              >
                {/* Current Plan Badge */}
                {plan.current && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="gap-1 bg-white/10 text-white/80 border-0">
                      <Check className="size-3" />
                      Ваш план
                    </Badge>
                  </div>
                )}

                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className="flex h-8 items-center justify-center bg-primary text-center text-xs font-semibold text-primary-foreground">
                    Рекомендуем
                  </div>
                )}

                <header className="p-6">
                  {/* Plan Icon & Title */}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      {plan.icon && (
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20">
                          <plan.icon className="size-4 text-primary" />
                        </div>
                      )}
                      <h2 className="text-xl font-semibold text-white">{plan.title}</h2>
                    </div>
                    <p className="text-sm text-white/50">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">
                        {annualBilling ? plan.price.annually : plan.price.monthly}
                      </span>
                      {plan.title !== "Стартовый" && (
                        <span className="text-sm text-white/40">/ месяц</span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    variant={plan.current ? "secondary" : plan.recommended ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      !plan.recommended && !plan.current && "border-white/20 bg-transparent text-white hover:bg-white/10"
                    )}
                    disabled={plan.current}
                  >
                    {plan.current ? "Текущий план" : "Выбрать план"}
                  </Button>
                </header>

                {/* Features */}
                <main className="space-y-4 border-t border-white/10 p-6">
                  {plan.featureGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                        {group.title}
                      </h3>
                      <ul className="space-y-2.5">
                        {group.features.map((feature) => (
                          <li
                            key={feature.title}
                            className={cn(
                              "flex items-center gap-2 text-sm",
                              feature.icon === Check 
                                ? "text-white/80" 
                                : "text-white/30"
                            )}
                          >
                            <feature.icon className={cn(
                              "size-4 shrink-0",
                              feature.icon === Check ? "text-primary" : ""
                            )} />
                            {feature.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </main>
              </article>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Pricing;
