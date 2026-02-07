import { Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AnimatedBackground from "@/components/layout/AnimatedBackground";

const plans = [
  {
    title: "Стартовый",
    description: "Для знакомства с платформой",
    price: { monthly: "Бесплатно", annually: "Бесплатно" },
    recommended: false,
    current: false,
    featureGroups: [
      {
        title: "Возможности",
        features: [
          { title: "3 курса", available: true },
          { title: "Базовые шаблоны", available: true },
          { title: "AI-генерация", available: false },
          { title: "Аналитика", available: false },
        ],
      },
    ],
  },
  {
    title: "Pro",
    description: "Для профессионалов",
    price: {
      monthly: "₽2 490",
      annually: "₽1 990",
    },
    discount: "-20%",
    recommended: true,
    current: false,
    featureGroups: [
      {
        title: "Возможности",
        features: [
          { title: "Безлимитные курсы", available: true },
          { title: "Все шаблоны", available: true },
          { title: "Безлимитная AI-генерация", available: true },
          { title: "Расширенная аналитика", available: true },
          { title: "Приоритетная поддержка", available: true },
        ],
      },
    ],
  },
  {
    title: "Команда",
    description: "Для организаций",
    price: {
      monthly: "₽9 990",
      annually: "₽7 990",
    },
    discount: "-20%",
    recommended: false,
    current: false,
    featureGroups: [
      {
        title: "Возможности",
        features: [
          { title: "Всё из Pro", available: true },
          { title: "До 10 участников", available: true },
          { title: "Брендирование", available: true },
          { title: "API доступ", available: true },
          { title: "Персональный менеджер", available: true },
        ],
      },
    ],
  },
];

const Pricing = () => {
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Animated background for consistency */}
      <AnimatedBackground />

      {/* Content */}
      <div 
        className="flex-1 flex flex-col relative z-10 py-12 md:py-20 px-6 transition-all duration-300"
        style={{
          paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1.5rem)',
        }}
      >
        <div className="container max-w-5xl mx-auto px-6">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl xl:text-5xl">
              Тарифы и цены
            </h1>
            <p className="text-muted-foreground lg:text-lg">
              Выберите план, который подходит именно вам
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="mb-12 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-sidebar/80 backdrop-blur-sm border border-sidebar-border p-1.5 px-4">
              <span className={cn(
                "text-sm font-medium transition-colors",
                !annualBilling ? "text-sidebar-foreground" : "text-sidebar-foreground/60"
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
                annualBilling ? "text-sidebar-foreground" : "text-sidebar-foreground/60"
              )}>
                Ежегодно
              </span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => (
              <Card
                key={plan.title}
                className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  "bg-sidebar/80 backdrop-blur-sm border-sidebar-border",
                  "hover:bg-sidebar/90 hover:border-sidebar-accent",
                  plan.recommended 
                    ? "border-primary shadow-lg shadow-primary/10 md:scale-105 z-10" 
                    : "",
                  index === 0 && "md:-mr-2",
                  index === 2 && "md:-ml-2"
                )}
              >
                {/* Current Plan Badge */}
                {plan.current && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="gap-1 bg-sidebar-accent text-sidebar-accent-foreground">
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

                <CardHeader className="p-6">
                  {/* Plan Title */}
                  <div className="mb-6">
                    <h2 className="mb-2 text-xl font-semibold text-sidebar-foreground">{plan.title}</h2>
                    <p className="text-sm text-sidebar-foreground/60">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-sidebar-foreground">
                        {annualBilling ? plan.price.annually : plan.price.monthly}
                      </span>
                      {plan.title !== "Стартовый" && (
                        <span className="text-sm text-sidebar-foreground/60">/ месяц</span>
                      )}
                      {annualBilling && plan.discount && (
                        <Badge className="bg-primary/20 text-primary border-0 text-xs">
                          {plan.discount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    variant={plan.current ? "secondary" : plan.recommended ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      !plan.recommended && !plan.current && "border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    disabled={plan.current}
                  >
                    {plan.current ? "Текущий план" : "Выбрать план"}
                  </Button>
                </CardHeader>

                {/* Features */}
                <CardContent className="space-y-4 border-t border-sidebar-border p-6">
                  {plan.featureGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                        {group.title}
                      </h3>
                      <ul className="space-y-2.5">
                        {group.features.map((feature) => (
                          <li
                            key={feature.title}
                            className={cn(
                              "flex items-center gap-2 text-sm",
                              feature.available 
                                ? "text-sidebar-foreground" 
                                : "text-sidebar-foreground/30"
                            )}
                          >
                            {feature.available ? (
                              <Check className="size-4 shrink-0 text-primary" />
                            ) : (
                              <X className="size-4 shrink-0" />
                            )}
                            {feature.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
