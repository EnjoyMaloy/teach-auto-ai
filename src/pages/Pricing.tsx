import { Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Pastel violet color matching logo "A" - hsl(265, 60%, 75%)
const PASTEL_VIOLET = "hsl(265 60% 75%)";

const plans = [
  {
    title: "Стартовый",
    description: "Для знакомства с платформой",
    price: { monthly: "Free", annually: "Free" },
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
      monthly: "$24",
      annually: "$19",
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
      monthly: "$99",
      annually: "$79",
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">

      {/* Content */}
      <div 
        className="flex-1 flex flex-col relative z-10 py-8 md:py-12 lg:py-20 px-4 md:px-6 transition-all duration-300"
        style={{
          paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1rem)',
        }}
      >
        {/* Top spacer for sidebar trigger on mobile */}
        <div className="h-10 md:h-0" />
        
        <div className="container max-w-5xl mx-auto px-2 sm:px-6">
          {/* Title */}
          <div className="mb-8 md:mb-12 text-center">
            <h1 className="mb-3 md:mb-4 text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-bold text-foreground">
              Тарифы и цены
            </h1>
            <p className="text-sm md:text-base text-muted-foreground lg:text-lg">
              Выберите план, который подходит именно вам
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="mb-8 md:mb-12 flex justify-center">
            <div className="flex items-center gap-2 md:gap-3 rounded-full bg-sidebar/80 backdrop-blur-sm border border-sidebar-border p-1 md:p-1.5 px-3 md:px-4">
              <span className={cn(
                "text-xs md:text-sm font-medium transition-colors",
                !annualBilling ? "text-sidebar-foreground" : "text-sidebar-foreground/60"
              )}>
                Ежемесячно
              </span>
              <Switch
                id="annual-billing"
                checked={annualBilling}
                onCheckedChange={setAnnualBilling}
                className="data-[state=checked]:bg-[hsl(265_60%_75%)]"
              />
              <span className={cn(
                "text-xs md:text-sm font-medium transition-colors",
                annualBilling ? "text-sidebar-foreground" : "text-sidebar-foreground/60"
              )}>
                Ежегодно
              </span>
            </div>
          </div>

          {/* Plans Grid - responsive for tablets */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Card
                key={plan.title}
                className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  "bg-sidebar/80 backdrop-blur-sm border border-foreground/10 dark:border-sidebar-border",
                  "hover:bg-sidebar/90 hover:border-foreground/20 dark:hover:border-sidebar-accent",
                  plan.recommended 
                    ? "border-[hsl(265_60%_75%)] dark:border-[hsl(265_60%_75%)] shadow-lg shadow-[hsl(265_60%_75%_/_0.2)] lg:scale-105 z-10" 
                    : "",
                  index === 0 && "lg:-mr-2",
                  index === 2 && "lg:-ml-2 sm:col-span-2 lg:col-span-1"
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
                  <div 
                    className="flex h-8 items-center justify-center text-center text-xs font-semibold text-white"
                    style={{ backgroundColor: PASTEL_VIOLET }}
                  >
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
                  <div className="pb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-sidebar-foreground">
                        {annualBilling ? plan.price.annually : plan.price.monthly}
                      </span>
                      {plan.title !== "Стартовый" && (
                        <span className="text-sm text-sidebar-foreground/60">/ месяц</span>
                      )}
                      {annualBilling && plan.discount && (
                        <Badge 
                          className="border-0 text-xs text-white"
                          style={{ backgroundColor: `hsl(265 60% 75% / 0.3)`, color: PASTEL_VIOLET }}
                        >
                          {plan.discount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Spacer for more breathing room */}
                  <div className="h-6" />

                  {/* CTA Button */}
                  <Button
                    variant={plan.current ? "secondary" : plan.recommended ? "default" : "outline"}
                    className={cn(
                      "w-full transition-all",
                      plan.recommended 
                        ? "bg-[hsl(265_60%_75%)] hover:bg-[hsl(265_60%_70%)] text-white border-0"
                        : !plan.current && "border-foreground/20 dark:border-sidebar-border hover:bg-[hsl(265_60%_75%)] hover:text-white hover:border-[hsl(265_60%_75%)]"
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
                              <Check className="size-4 shrink-0" style={{ color: PASTEL_VIOLET }} />
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
