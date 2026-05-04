export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      articles: {
        Row: {
          access_type: string
          category: string | null
          content: string
          content_en: string | null
          cover_gradient: string | null
          cover_image: string | null
          cover_type: string
          created_at: string
          en_modified: boolean
          id: string
          og_image: string | null
          seo_description: string | null
          seo_description_en: string | null
          seo_keywords: string[] | null
          seo_keywords_en: string[] | null
          seo_title: string | null
          seo_title_en: string | null
          title: string
          title_color: string | null
          title_en: string | null
          translation_stale: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          access_type?: string
          category?: string | null
          content?: string
          content_en?: string | null
          cover_gradient?: string | null
          cover_image?: string | null
          cover_type?: string
          created_at?: string
          en_modified?: boolean
          id?: string
          og_image?: string | null
          seo_description?: string | null
          seo_description_en?: string | null
          seo_keywords?: string[] | null
          seo_keywords_en?: string[] | null
          seo_title?: string | null
          seo_title_en?: string | null
          title?: string
          title_color?: string | null
          title_en?: string | null
          translation_stale?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          access_type?: string
          category?: string | null
          content?: string
          content_en?: string | null
          cover_gradient?: string | null
          cover_image?: string | null
          cover_type?: string
          created_at?: string
          en_modified?: boolean
          id?: string
          og_image?: string | null
          seo_description?: string | null
          seo_description_en?: string | null
          seo_keywords?: string[] | null
          seo_keywords_en?: string[] | null
          seo_title?: string | null
          seo_title_en?: string | null
          title?: string
          title_color?: string | null
          title_en?: string | null
          translation_stale?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      base_design_systems: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_ai_messages: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ai_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_analytics: {
        Row: {
          course_id: string
          created_at: string
          event_type: string
          id: string
          lesson_id: string | null
          slide_id: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          event_type: string
          id?: string
          lesson_id?: string | null
          slide_id?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          event_type?: string
          id?: string
          lesson_id?: string | null
          slide_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_analytics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_analytics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_analytics_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "slides"
            referencedColumns: ["id"]
          },
        ]
      }
      course_languages: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_primary: boolean
          language_code: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          language_code: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          language_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_languages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          ai_recommendation: string | null
          comment: string | null
          course_id: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          ai_recommendation?: string | null
          comment?: string | null
          course_id: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          ai_recommendation?: string | null
          comment?: string | null
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          author_id: string
          base_design_system_id: string | null
          category: string | null
          cover_image: string | null
          created_at: string
          current_version: number | null
          description: string | null
          design_system: Json | null
          estimated_minutes: number | null
          id: string
          is_link_accessible: boolean | null
          is_published: boolean | null
          lessons_display_type: string
          moderation_comment: string | null
          moderation_status: string | null
          published_at: string | null
          short_description: string | null
          submitted_for_moderation_at: string | null
          tags: string[] | null
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          base_design_system_id?: string | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          current_version?: number | null
          description?: string | null
          design_system?: Json | null
          estimated_minutes?: number | null
          id?: string
          is_link_accessible?: boolean | null
          is_published?: boolean | null
          lessons_display_type?: string
          moderation_comment?: string | null
          moderation_status?: string | null
          published_at?: string | null
          short_description?: string | null
          submitted_for_moderation_at?: string | null
          tags?: string[] | null
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          base_design_system_id?: string | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          current_version?: number | null
          description?: string | null
          design_system?: Json | null
          estimated_minutes?: number | null
          id?: string
          is_link_accessible?: boolean | null
          is_published?: boolean | null
          lessons_display_type?: string
          moderation_comment?: string | null
          moderation_status?: string | null
          published_at?: string | null
          short_description?: string | null
          submitted_for_moderation_at?: string | null
          tags?: string[] | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_base_design_system_id_fkey"
            columns: ["base_design_system_id"]
            isOneToOne: false
            referencedRelation: "base_design_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      dictionary_words: {
        Row: {
          category: string
          created_at: string
          definition: string
          difficulty_easy_content: Json | null
          difficulty_hard_content: Json | null
          difficulty_medium_content: Json | null
          id: string
          image_url: string | null
          term: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          definition: string
          difficulty_easy_content?: Json | null
          difficulty_hard_content?: Json | null
          difficulty_medium_content?: Json | null
          id?: string
          image_url?: string | null
          term: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          definition?: string
          difficulty_easy_content?: Json | null
          difficulty_hard_content?: Json | null
          difficulty_medium_content?: Json | null
          id?: string
          image_url?: string | null
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_translations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          language_code: string
          lesson_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          lesson_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          lesson_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_translations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          cover_image: string | null
          created_at: string
          description: string | null
          estimated_minutes: number | null
          icon: string | null
          id: string
          order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          icon?: string | null
          id?: string
          order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          icon?: string | null
          id?: string
          order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      published_lesson_translations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          language_code: string
          published_lesson_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          published_lesson_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          published_lesson_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_lesson_translations_published_lesson_id_fkey"
            columns: ["published_lesson_id"]
            isOneToOne: false
            referencedRelation: "published_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      published_lessons: {
        Row: {
          course_id: string
          cover_image: string | null
          created_at: string
          description: string | null
          estimated_minutes: number | null
          icon: string | null
          id: string
          order: number
          original_lesson_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          icon?: string | null
          id?: string
          order?: number
          original_lesson_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          icon?: string | null
          id?: string
          order?: number
          original_lesson_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      published_slide_translations: {
        Row: {
          blank_word: string | null
          content: string | null
          created_at: string
          explanation: string | null
          explanation_correct: string | null
          explanation_partial: string | null
          hints: Json | null
          id: string
          is_stale: boolean
          language_code: string
          matching_pairs: Json | null
          options: Json | null
          ordering_items: Json | null
          published_slide_id: string
          sub_blocks: Json | null
          updated_at: string
        }
        Insert: {
          blank_word?: string | null
          content?: string | null
          created_at?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_partial?: string | null
          hints?: Json | null
          id?: string
          is_stale?: boolean
          language_code: string
          matching_pairs?: Json | null
          options?: Json | null
          ordering_items?: Json | null
          published_slide_id: string
          sub_blocks?: Json | null
          updated_at?: string
        }
        Update: {
          blank_word?: string | null
          content?: string | null
          created_at?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_partial?: string | null
          hints?: Json | null
          id?: string
          is_stale?: boolean
          language_code?: string
          matching_pairs?: Json | null
          options?: Json | null
          ordering_items?: Json | null
          published_slide_id?: string
          sub_blocks?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_slide_translations_published_slide_id_fkey"
            columns: ["published_slide_id"]
            isOneToOne: false
            referencedRelation: "published_slides"
            referencedColumns: ["id"]
          },
        ]
      }
      published_slides: {
        Row: {
          article_id: string | null
          audio_url: string | null
          background_color: string | null
          blank_word: string | null
          content: string
          correct_answer: Json | null
          correct_order: Json | null
          created_at: string
          explanation: string | null
          explanation_correct: string | null
          explanation_partial: string | null
          hints: Json | null
          id: string
          image_url: string | null
          matching_pairs: Json | null
          options: Json | null
          order: number
          ordering_items: Json | null
          original_slide_id: string
          published_lesson_id: string
          slider_correct: number | null
          slider_max: number | null
          slider_min: number | null
          slider_step: number | null
          sub_blocks: Json | null
          text_color: string | null
          text_size: string | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          article_id?: string | null
          audio_url?: string | null
          background_color?: string | null
          blank_word?: string | null
          content?: string
          correct_answer?: Json | null
          correct_order?: Json | null
          created_at?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_partial?: string | null
          hints?: Json | null
          id?: string
          image_url?: string | null
          matching_pairs?: Json | null
          options?: Json | null
          order?: number
          ordering_items?: Json | null
          original_slide_id: string
          published_lesson_id: string
          slider_correct?: number | null
          slider_max?: number | null
          slider_min?: number | null
          slider_step?: number | null
          sub_blocks?: Json | null
          text_color?: string | null
          text_size?: string | null
          type: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          article_id?: string | null
          audio_url?: string | null
          background_color?: string | null
          blank_word?: string | null
          content?: string
          correct_answer?: Json | null
          correct_order?: Json | null
          created_at?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_partial?: string | null
          hints?: Json | null
          id?: string
          image_url?: string | null
          matching_pairs?: Json | null
          options?: Json | null
          order?: number
          ordering_items?: Json | null
          original_slide_id?: string
          published_lesson_id?: string
          slider_correct?: number | null
          slider_max?: number | null
          slider_min?: number | null
          slider_step?: number | null
          sub_blocks?: Json | null
          text_color?: string | null
          text_size?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "published_slides_published_lesson_id_fkey"
            columns: ["published_lesson_id"]
            isOneToOne: false
            referencedRelation: "published_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      slide_translations: {
        Row: {
          blank_word: string | null
          content: string | null
          created_at: string
          explanation: string | null
          explanation_correct: string | null
          explanation_partial: string | null
          hints: Json | null
          id: string
          is_stale: boolean
          language_code: string
          matching_pairs: Json | null
          options: Json | null
          ordering_items: Json | null
          slide_id: string
          sub_blocks: Json | null
          updated_at: string
        }
        Insert: {
          blank_word?: string | null
          content?: string | null
          created_at?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_partial?: string | null
          hints?: Json | null
          id?: string
          is_stale?: boolean
          language_code: string
          matching_pairs?: Json | null
          options?: Json | null
          ordering_items?: Json | null
          slide_id: string
          sub_blocks?: Json | null
          updated_at?: string
        }
        Update: {
          blank_word?: string | null
          content?: string | null
          created_at?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_partial?: string | null
          hints?: Json | null
          id?: string
          is_stale?: boolean
          language_code?: string
          matching_pairs?: Json | null
          options?: Json | null
          ordering_items?: Json | null
          slide_id?: string
          sub_blocks?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slide_translations_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "slides"
            referencedColumns: ["id"]
          },
        ]
      }
      slides: {
        Row: {
          article_id: string | null
          audio_url: string | null
          background_color: string | null
          blank_word: string | null
          content: string
          correct_answer: Json | null
          correct_order: Json | null
          created_at: string
          explanation: string | null
          explanation_correct: string | null
          explanation_partial: string | null
          hints: Json | null
          id: string
          image_url: string | null
          lesson_id: string
          matching_pairs: Json | null
          options: Json | null
          order: number
          ordering_items: Json | null
          slider_correct: number | null
          slider_max: number | null
          slider_min: number | null
          slider_step: number | null
          sub_blocks: Json | null
          text_color: string | null
          text_size: string | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          article_id?: string | null
          audio_url?: string | null
          background_color?: string | null
          blank_word?: string | null
          content?: string
          correct_answer?: Json | null
          correct_order?: Json | null
          created_at?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_partial?: string | null
          hints?: Json | null
          id?: string
          image_url?: string | null
          lesson_id: string
          matching_pairs?: Json | null
          options?: Json | null
          order?: number
          ordering_items?: Json | null
          slider_correct?: number | null
          slider_max?: number | null
          slider_min?: number | null
          slider_step?: number | null
          sub_blocks?: Json | null
          text_color?: string | null
          text_size?: string | null
          type: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          article_id?: string | null
          audio_url?: string | null
          background_color?: string | null
          blank_word?: string | null
          content?: string
          correct_answer?: Json | null
          correct_order?: Json | null
          created_at?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_partial?: string | null
          hints?: Json | null
          id?: string
          image_url?: string | null
          lesson_id?: string
          matching_pairs?: Json | null
          options?: Json | null
          order?: number
          ordering_items?: Json | null
          slider_correct?: number | null
          slider_max?: number | null
          slider_min?: number | null
          slider_step?: number | null
          sub_blocks?: Json | null
          text_color?: string | null
          text_size?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slides_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slides_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_design_systems: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorite_articles: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorite_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_word_progress: {
        Row: {
          created_at: string
          easy_completed: boolean | null
          hard_completed: boolean | null
          id: string
          last_studied_at: string | null
          medium_completed: boolean | null
          updated_at: string
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string
          easy_completed?: boolean | null
          hard_completed?: boolean | null
          id?: string
          last_studied_at?: string | null
          medium_completed?: boolean | null
          updated_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string
          easy_completed?: boolean | null
          hard_completed?: boolean | null
          id?: string
          last_studied_at?: string | null
          medium_completed?: boolean | null
          updated_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "dictionary_words"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_course_by_short_id: {
        Args: { short_id: string }
        Returns: {
          id: string
          is_link_accessible: boolean
          is_published: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "creator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "creator"],
    },
  },
} as const
