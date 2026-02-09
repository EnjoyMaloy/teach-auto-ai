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
    title: "Explorer",
    description: "Для знакомства с платформой",
    price: { monthly: "Free", annually: "Free" },
    recommended: false,
    current: false,
    featureGroups: [
      {
        title: "Возможности",
        features: [
          { title: "До 3 курсов", available: true },
          { title: "Базовые шаблоны уроков", available: true },
          { title: "Ограниченная AI-генерация", available: true },
          { title: "Публикация в Open Academy Marketplace", available: true },
          { title: "Брендинг Open Academy на курсах", available: true },
          { title: "Базовая поддержка", available: true },
        ],
      },
    ],
  },
  {
    title: "Creator Pro",
    description: "Для экспертов и авторов курсов",
    price: {
      monthly: "$29",
      annually: "$23",
    },
    discount: "-20%",
    recommended: true,
    current: false,
    featureGroups: [
      {
        title: "Возможности",
        features: [
          { title: "Безлимитные курсы", available: true },
          { title: "Все шаблоны уроков", available: true },
          { title: "Полная AI-генерация курсов и уроков", available: true },
          { title: "Экспорт и embed курсов", available: true },
          { title: "Аналитика прохождения", available: true },
          { title: "Продажа курсов без watermark", available: true },
          { title: "Приоритетная поддержка", available: true },
        ],
      },
    ],
  },
  {
    title: "Studio",
    description: "Для команд и проектов",
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
          { title: "Всё из Creator Pro", available: true },
          { title: "Командный workspace", available: true },
          { title: "До 10 авторов", available: true },
          { title: "Брендирование (white-label)", available: true },
          { title: "Расширенная аналитика", available: true },
          { title: "API и интеграции", available: true },
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

          {/* Plans Grid - 1 column on mobile/tablet, 3 on desktop */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
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
                  index === 2 && "lg:-ml-2"
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
                  <div style={{ marginBottom: '2.5rem' }}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-sidebar-foreground">
                        {annualBilling ? plan.price.annually : plan.price.monthly}
                      </span>
                      {plan.title !== "Explorer" && (
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
