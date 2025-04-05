// src/app/error.tsx
'use client'; // קובץ error חייב להיות קומפוננטת לקוח

import { useEffect } from 'react';
import { Button } from '@/components/ui/button'; // נשתמש בכפתור שלנו
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // וברכיב קארד

export default function Error({
  error, // אובייקט השגיאה
  reset, // פונקציה לניסיון רינדור מחדש
}: {
  error: Error & { digest?: string }; // הטיפוס שמגיע מ-Next.js
  reset: () => void;
}) {
  useEffect(() => {
    // אפשר לשלוח את השגיאה למערכת ניטור חיצונית (Sentry, LogRocket וכו')
    console.error("Root Error Boundary Caught:", error);
  }, [error]);

  return (
     <div className="flex min-h-screen items-center justify-center p-8">
       <Card className="max-w-md border-destructive bg-destructive/10"> {/* עיצוב קל לשגיאה */}
         <CardHeader>
           <CardTitle className="text-destructive">אופס! משהו השתבש...</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <p className="text-sm text-destructive/90">
             אירעה שגיאה בלתי צפויה באפליקציה. אנו מתנצלים על אי הנוחות.
           </p>
           {/* בסביבת פיתוח אפשר להציג את הודעת השגיאה */}
           {process.env.NODE_ENV === 'development' && (
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-4 text-xs text-muted-foreground">
                 <code>{error.message}</code>
               </pre>
           )}
           <Button
             onClick={
               // נסה לרנדר מחדש את הסגמנט (layout + page)
               () => reset()
             }
             variant="destructive" // כפתור בסגנון מתאים לשגיאה
           >
             נסה שוב
           </Button>
         </CardContent>
       </Card>
     </div>
  );
}