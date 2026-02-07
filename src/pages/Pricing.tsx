import { Check, X, ArrowLeft, Zap, Crown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
    title: "Базовый",
    description: "Для начинающих авторов",
    price: {
      monthly: "₽990",
      annually: (
        <span className="flex items-center">
          ₽790<Badge className="ml-2">-20%</Badge>
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
          { title: "10 курсов", icon: Check },
          { title: "Все шаблоны", icon: Check },
          { title: "AI-генерация (лимит)", icon: Check },
          { title: "Базовая аналитика", icon: Check },
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
    icon: Crown,
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
  const navigate = useNavigate();
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Назад
          </Button>
        </div>
      </header>

      {/* Content */}
      <section className="py-12 md:py-20">
        <div className="container">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold md:text-4xl xl:text-5xl">
              Тарифы и цены
            </h1>
            <p className="text-muted-foreground lg:text-lg">
              Выберите план, который подходит именно вам
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="mb-12 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-muted/50 p-1.5 px-4">
              <span className={cn(
                "text-sm font-medium transition-colors",
                !annualBilling ? "text-foreground" : "text-muted-foreground"
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
                annualBilling ? "text-foreground" : "text-muted-foreground"
              )}>
                Ежегодно
              </span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.title}
                className={cn(
                  "relative rounded-2xl border bg-card overflow-hidden transition-all",
                  plan.recommended 
                    ? "border-primary shadow-lg shadow-primary/10" 
                    : "border-border hover:border-primary/50"
                )}
              >
                {/* Current Plan Badge */}
                {plan.current && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="gap-1">
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
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                          <plan.icon className="size-4 text-primary" />
                        </div>
                      )}
                      <h2 className="text-xl font-semibold">{plan.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {annualBilling ? plan.price.annually : plan.price.monthly}
                      </span>
                      {plan.title !== "Стартовый" && (
                        <span className="text-sm text-muted-foreground">/ месяц</span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    variant={plan.current ? "secondary" : plan.recommended ? "default" : "outline"}
                    className="w-full"
                    disabled={plan.current}
                  >
                    {plan.current ? "Текущий план" : "Выбрать план"}
                  </Button>
                </header>

                {/* Features */}
                <main className="space-y-4 border-t border-border p-6">
                  {plan.featureGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.title}
                      </h3>
                      <ul className="space-y-2.5">
                        {group.features.map((feature) => (
                          <li
                            key={feature.title}
                            className={cn(
                              "flex items-center gap-2 text-sm",
                              feature.icon === Check 
                                ? "text-foreground" 
                                : "text-muted-foreground/50"
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

          {/* FAQ or Contact */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Нужен индивидуальный план?{" "}
              <Button variant="link" className="h-auto p-0 text-primary">
                Свяжитесь с нами
              </Button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
