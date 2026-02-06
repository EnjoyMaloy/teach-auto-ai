import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Palette, Type, Component, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Color palette tokens extracted from the dark theme
const colorPalette = {
  primary: [
    { name: 'Primary', hsl: '243 75% 58%', hex: '#6366F1', usage: 'Основной акцент, кнопки' },
    { name: 'Primary Hover', hsl: '265 60% 58%', hex: '#A855F7', usage: 'Hover состояние' },
    { name: 'Primary Light', hsl: '265 60% 95%', hex: '#F3E8FF', usage: 'Фоны акцентов' },
  ],
  accent: [
    { name: 'Accent Name', hsl: '265 60% 75%', hex: '#C4B5FD', usage: 'Имя пользователя, выделения' },
    { name: 'Accent Logo', hsl: '265 60% 75%', hex: '#C4B5FD', usage: 'Буква A в логотипе' },
  ],
  background: [
    { name: 'Background Dark', hsl: '240 6% 7%', hex: '#0f0f12', usage: 'Основной фон страниц' },
    { name: 'Card Dark', hsl: '240 4% 10%', hex: '#1a1a1b', usage: 'Карточки, поля ввода' },
    { name: 'Border', hsl: '0 0% 100% / 10%', hex: '#FFFFFF1A', usage: 'Границы элементов' },
  ],
  text: [
    { name: 'Text Primary', hsl: '0 0% 100%', hex: '#FFFFFF', usage: 'Основной текст' },
    { name: 'Text Secondary', hsl: '0 0% 100% / 70%', hex: '#FFFFFFB3', usage: 'Второстепенный текст' },
    { name: 'Text Muted', hsl: '0 0% 100% / 40%', hex: '#FFFFFF66', usage: 'Приглушенный текст, плейсхолдеры' },
  ],
  gradients: [
    { name: 'Blob Purple 1', hsl: '270 40% 35% / 40%', usage: 'Анимированные пятна фона' },
    { name: 'Blob Purple 2', hsl: '280 35% 40% / 30%', usage: 'Анимированные пятна фона' },
    { name: 'Blob Purple 3', hsl: '260 35% 45% / 35%', usage: 'Анимированные пятна фона' },
  ],
  status: [
    { name: 'Success', hsl: '160 50% 45%', hex: '#10B981', usage: 'Успешные действия' },
    { name: 'Warning', hsl: '35 80% 55%', hex: '#F59E0B', usage: 'Предупреждения' },
    { name: 'Destructive', hsl: '0 72% 50%', hex: '#EF4444', usage: 'Ошибки, удаление' },
  ],
};

const typography = [
  { name: 'Display XL', className: 'text-5xl font-semibold', sample: 'What\'s on your mind, Павел?' },
  { name: 'Heading 1', className: 'text-4xl font-bold', sample: 'Заголовок первого уровня' },
  { name: 'Heading 2', className: 'text-2xl font-semibold', sample: 'Заголовок второго уровня' },
  { name: 'Heading 3', className: 'text-xl font-medium', sample: 'Заголовок третьего уровня' },
  { name: 'Body Large', className: 'text-lg', sample: 'Основной текст увеличенный для важных блоков' },
  { name: 'Body', className: 'text-base', sample: 'Стандартный размер текста для большинства контента' },
  { name: 'Body Small', className: 'text-sm', sample: 'Уменьшенный текст для подписей и меток' },
  { name: 'Caption', className: 'text-xs text-muted-foreground', sample: 'Самый мелкий текст для метаданных' },
];

const ColorSwatch = ({ color }: { color: { name: string; hsl: string; hex?: string; usage: string } }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
      <div 
        className="w-12 h-12 rounded-lg border border-white/10 shrink-0"
        style={{ background: color.hex || `hsl(${color.hsl})` }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white">{color.name}</div>
        <div className="text-sm text-white/50 truncate">{color.usage}</div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => copyToClipboard(color.hsl)}
          className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 text-white/70"
        >
          HSL
        </button>
        {color.hex && (
          <button
            onClick={() => copyToClipboard(color.hex!)}
            className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 text-white/70"
          >
            HEX
          </button>
        )}
        {copied && <Check className="w-4 h-4 text-green-400" />}
      </div>
    </div>
  );
};

const DesignSystem: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Дизайн-система Academy</h1>
          <p className="text-white/60 text-lg">
            Документация всех цветов, типографики, компонентов и эффектов проекта
          </p>
        </div>

        {/* Color Palette Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-[hsl(265,60%,75%)]" />
            <h2 className="text-2xl font-semibold">Цветовая палитра</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Primary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {colorPalette.primary.map((color) => (
                  <ColorSwatch key={color.name} color={color} />
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Accent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {colorPalette.accent.map((color) => (
                  <ColorSwatch key={color.name} color={color} />
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {colorPalette.background.map((color) => (
                  <ColorSwatch key={color.name} color={color} />
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {colorPalette.text.map((color) => (
                  <ColorSwatch key={color.name} color={color} />
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Gradients & Blobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {colorPalette.gradients.map((color) => (
                  <ColorSwatch key={color.name} color={color} />
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {colorPalette.status.map((color) => (
                  <ColorSwatch key={color.name} color={color} />
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="bg-white/10" />

        {/* Typography Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Type className="w-6 h-6 text-[hsl(265,60%,75%)]" />
            <h2 className="text-2xl font-semibold">Типографика</h2>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6 space-y-6">
              {typography.map((item) => (
                <div key={item.name} className="flex items-baseline gap-6 pb-4 border-b border-white/5 last:border-0">
                  <div className="w-32 shrink-0">
                    <span className="text-sm text-white/50">{item.name}</span>
                    <div className="text-xs text-white/30 mt-1 font-mono">{item.className}</div>
                  </div>
                  <div className={item.className + ' text-white'}>{item.sample}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Шрифты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm text-white/50">Display</div>
                <div className="font-display text-xl">Inter — для заголовков</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm text-white/50">Body</div>
                <div className="font-sans text-xl">Lato — основной текст</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm text-white/50">Serif</div>
                <div className="font-serif text-xl">EB Garamond — акценты</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm text-white/50">Mono</div>
                <div className="font-mono text-xl">Fira Code — код</div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-white/10" />

        {/* Components Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Component className="w-6 h-6 text-[hsl(265,60%,75%)]" />
            <h2 className="text-2xl font-semibold">Компоненты</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Buttons */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Кнопки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-sm text-white/50 mb-3">Кнопка отправки (минималистичная)</p>
                  <div className="flex items-center gap-4">
                    <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                    </button>
                    <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center cursor-not-allowed">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inputs */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Поля ввода</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Стандартный инпут" />
                <div className="p-4 bg-[#1a1a1b] border border-white/10 rounded-2xl">
                  <textarea 
                    placeholder="Опиши идею курса..."
                    className="w-full bg-transparent text-white placeholder:text-white/40 resize-none outline-none text-[15px]"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Бейджи</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Cards */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Карточки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-[#1a1a1b] border border-white/10 rounded-2xl">
                  <p className="text-white/70">Карточка с темным фоном и скруглением 2xl</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white/70">Карточка с полупрозрачным фоном</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="bg-white/10" />

        {/* Effects Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[hsl(265,60%,75%)]" />
            <h2 className="text-2xl font-semibold">Эффекты</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Hover Effects */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Hover-эффекты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <p className="text-white/70">hover:bg-white/10 — подсветка при наведении</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg hover-scale cursor-pointer">
                  <p className="text-white/70">hover-scale — увеличение при наведении</p>
                </div>
                <button className="px-4 py-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                  hover:bg-primary/90
                </button>
              </CardContent>
            </Card>

            {/* Animations */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Анимации</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-white/50">name-glow (4s)</p>
                  <span className="text-2xl font-semibold animate-[name-glow_4s_ease-in-out_infinite]" style={{ color: 'hsl(265, 60%, 75%)' }}>
                    Павел
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-white/50">blob-float (12-20s)</p>
                  <div className="relative h-24 overflow-hidden rounded-lg bg-[#0f0f12]">
                    <div 
                      className="absolute w-32 h-32 rounded-full blur-[30px] animate-[blob-float-1_12s_ease-in-out_infinite]"
                      style={{ background: 'hsl(270 40% 35% / 0.6)', top: '50%', left: '30%' }}
                    />
                    <div 
                      className="absolute w-24 h-24 rounded-full blur-[25px] animate-[blob-float-2_15s_ease-in-out_infinite]"
                      style={{ background: 'hsl(280 35% 40% / 0.5)', top: '40%', left: '60%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shadows */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Тени</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/10 rounded-xl shadow-sm" />
                  <span className="text-sm text-white/50">shadow-sm</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/10 rounded-xl shadow-lg" />
                  <span className="text-sm text-white/50">shadow-lg</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-primary/20 rounded-xl" style={{ boxShadow: '0 4px 20px 0 hsl(265 60% 65% / 0.3)' }} />
                  <span className="text-sm text-white/50">shadow-primary</span>
                </div>
              </CardContent>
            </Card>

            {/* Border Radius */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Скругления</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white/10 rounded" />
                  <span className="text-xs text-white/50">rounded</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white/10 rounded-lg" />
                  <span className="text-xs text-white/50">rounded-lg</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white/10 rounded-xl" />
                  <span className="text-xs text-white/50">rounded-xl</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl" />
                  <span className="text-xs text-white/50">rounded-2xl</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white/10 rounded-full" />
                  <span className="text-xs text-white/50">rounded-full</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystem;
