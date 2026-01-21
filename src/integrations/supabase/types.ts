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
      slides: {
        Row: {
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
          text_color: string | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
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
          text_color?: string | null
          type: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
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
          text_color?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slides_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
