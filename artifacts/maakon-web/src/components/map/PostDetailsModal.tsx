import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { AlertTriangle, MapPin, Phone, ShieldCheck, Clock, Flag, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { PostPublic, Ngo, CreateReportInputReason } from "@workspace/api-client-react";
import { useCreateReport, CreateReportInputReason as ReasonEnum } from "@workspace/api-client-react";

interface PostDetailsModalProps {
  item: PostPublic | Ngo | null;
  isOpen: boolean;
  onClose: () => void;
  type: 'post' | 'ngo';
}

const REPORT_REASONS = Object.values(ReasonEnum) as CreateReportInputReason[];

export function PostDetailsModal({ item, isOpen, onClose, type }: PostDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const dateLocale = isRtl ? ar : enUS;

  const [showReport, setShowReport] = useState(false);
  const [selectedReason, setSelectedReason] = useState<CreateReportInputReason>(ReasonEnum.spam);
  const [reportDone, setReportDone] = useState(false);

  const createReport = useCreateReport();

  if (!item) return null;

  const isNgo = type === 'ngo';
  const isPost = type === 'post';
  const post = isPost ? (item as PostPublic) : null;
  const ngo = isNgo ? (item as Ngo) : null;

  const title = post ? post.title : ngo?.name;
  const description = post ? post.description : ngo?.description;
  const governorate = post ? post.governorate : ngo?.governorate;
  const district = post ? post.district : ngo?.district;
  const contactInfo = post ? post.contactInfo : ngo?.phone;
  const contactMethod = post ? post.contactMethod : 'phone';
  const timestamp = post ? new Date(post.updatedAt) : ngo ? new Date(ngo.createdAt) : new Date();

  const handleClose = () => {
    setShowReport(false);
    setReportDone(false);
    setSelectedReason(ReasonEnum.spam);
    onClose();
  };

  const handleReport = () => {
    if (!post) return;
    createReport.mutate(
      { data: { postId: post.id, reason: selectedReason } },
      { onSuccess: () => setReportDone(true) }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl p-0 overflow-hidden bg-card border-border shadow-2xl">

        {/* Header Color Bar */}
        <div className={`h-16 w-full ${
          isNgo ? 'bg-info' :
          post?.postType === 'need' ? 'bg-destructive' : 'bg-success'
        } flex items-center px-6 relative`}>
          <div className="absolute -bottom-6 right-6">
            <div className="w-12 h-12 rounded-full bg-background border-4 border-card flex items-center justify-center shadow-sm">
              {isNgo ? <ShieldCheck className="w-6 h-6 text-info" /> :
               post?.postType === 'need' ? <AlertTriangle className="w-6 h-6 text-destructive" /> :
               <HeartHandshake className="w-6 h-6 text-success" />}
            </div>
          </div>
        </div>

        <div className="p-6 pt-8 flex flex-col gap-5">
          <DialogHeader>
            <div className="flex flex-wrap gap-2 mb-3">
              {isNgo && (
                <Badge variant="secondary" className="bg-info/10 text-info hover:bg-info/20">
                  {t('ngos')}
                </Badge>
              )}
              {isPost && post && (
                <>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {t(post.category)}
                  </Badge>
                  {post.postType === 'need' && post.urgency && (
                    <Badge variant={post.urgency === 'critical' ? 'destructive' : 'secondary'}>
                      {t(post.urgency)}
                    </Badge>
                  )}
                </>
              )}
            </div>

            <DialogTitle className="text-2xl font-bold text-foreground leading-tight mb-2">
              {title}
            </DialogTitle>

            <div className="flex items-center text-sm text-muted-foreground gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {formatDistanceToNow(timestamp, { addSuffix: true, locale: dateLocale })}
              </span>
            </div>
          </DialogHeader>

          <DialogDescription className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {description || "لا يوجد وصف / No description provided"}
          </DialogDescription>

          <div className="bg-secondary/50 rounded-xl p-4 flex flex-col gap-3 mt-2 border border-border/50">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">{t('governorate')}: {governorate}</p>
                {district && <p className="text-sm text-muted-foreground">{t('district')}: {district}</p>}
              </div>
            </div>

            {contactInfo && (
              <div className="flex items-start gap-3 pt-3 border-t border-border/50">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{t('contact_info')}</p>
                  <p className="text-sm text-primary font-medium" dir="ltr">{contactInfo}</p>
                  {contactMethod && <p className="text-xs text-muted-foreground uppercase">{contactMethod}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Report panel — only for posts */}
          {isPost && !showReport && !reportDone && (
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                onClick={() => setShowReport(true)}
              >
                <Flag className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t('report_post')}
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 hover-elevate shadow-md"
                onClick={handleClose}
              >
                {t('close')}
              </Button>
            </div>
          )}

          {isPost && showReport && !reportDone && (
            <div className="flex flex-col gap-3 mt-2 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground">{t('report_reason')}</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_REASONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedReason(r)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      selectedReason === r
                        ? 'bg-destructive text-destructive-foreground border-destructive'
                        : 'bg-background border-border text-foreground hover:border-destructive/40'
                    }`}
                  >
                    {t(`reason_${r}`, { defaultValue: r })}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowReport(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReport}
                  disabled={createReport.isPending}
                >
                  {createReport.isPending ? '...' : t('submit_report')}
                </Button>
              </div>
            </div>
          )}

          {reportDone && (
            <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl p-4 mt-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <p className="text-sm text-foreground">{t('report_thanks')}</p>
            </div>
          )}

          {isNgo && (
            <Button className="w-full bg-primary hover:bg-primary/90 mt-2" onClick={handleClose}>
              {t('close')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HeartHandshake(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 9.2a2.25 2.25 0 0 0-1.04 1.8v0A2.25 2.25 0 0 0 10.25 13h0A2.25 2.25 0 0 0 12 10.8V5Z"/><path d="M12 5l2.96 4.2a2.25 2.25 0 0 1 1.04 1.8v0a2.25 2.25 0 0 1-2.25 2h0a2.25 2.25 0 0 1-1.75-2.2V5Z"/></svg>
}
